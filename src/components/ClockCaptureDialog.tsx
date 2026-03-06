import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClockCaptureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: CaptureData) => void;
  requirePhoto: boolean;
  requireGeo: boolean;
  isClockIn: boolean;
  employeeId: string;
  isLoading: boolean;
}

export interface CaptureData {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  photoUrl?: string;
}

const ClockCaptureDialog = ({
  isOpen,
  onClose,
  onComplete,
  requirePhoto,
  requireGeo,
  isClockIn,
  employeeId,
  isLoading: externalLoading,
}: ClockCaptureDialogProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [geoData, setGeoData] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [photoStatus, setPhotoStatus] = useState<'idle' | 'camera' | 'captured' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Auto-start geo capture on open
  useEffect(() => {
    if (isOpen && requireGeo && geoStatus === 'idle') {
      captureGeolocation();
    }
  }, [isOpen, requireGeo]);

  // Auto-start camera on open
  useEffect(() => {
    if (isOpen && requirePhoto && photoStatus === 'idle') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, requirePhoto]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setGeoStatus('idle');
      setGeoData(null);
      setGeoError(null);
      setPhotoStatus('idle');
      setCapturedImage(null);
      setUploadedUrl(null);
      stopCamera();
    }
  }, [isOpen]);

  const captureGeolocation = () => {
    setGeoStatus('loading');
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoData({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGeoStatus('success');
      },
      (err) => {
        setGeoStatus('error');
        setGeoError(err.message || 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPhotoStatus('camera');
    } catch {
      setPhotoStatus('error');
      toast({ title: 'Camera access denied', description: 'Please allow camera access to take a photo.', variant: 'destructive' });
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      setCapturedImage(dataUrl);
      setPhotoStatus('captured');
      stopCamera();
    }
  }, []);

  const retakePhoto = () => {
    setCapturedImage(null);
    setPhotoStatus('idle');
    startCamera();
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!capturedImage) return null;
    setPhotoStatus('uploading');
    try {
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const timestamp = Date.now();
      const action = isClockIn ? 'clock-in' : 'clock-out';
      const filePath = `${employeeId}/${action}-${timestamp}.jpg`;

      const { error } = await supabase.storage
        .from('clock-photos')
        .upload(filePath, blob, { contentType: 'image/jpeg' });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('clock-photos')
        .getPublicUrl(filePath);

      setUploadedUrl(urlData.publicUrl);
      setPhotoStatus('uploaded');
      return filePath; // Store path, not public URL since bucket is private
    } catch (err: any) {
      setPhotoStatus('error');
      toast({ title: 'Photo upload failed', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const handleConfirm = async () => {
    const data: CaptureData = {};

    if (requireGeo && geoData) {
      data.latitude = geoData.lat;
      data.longitude = geoData.lng;
      data.accuracy = geoData.accuracy;
    }

    if (requirePhoto) {
      const path = await uploadPhoto();
      if (!path) return; // Upload failed
      data.photoUrl = path;
    }

    onComplete(data);
  };

  const canConfirm =
    (!requireGeo || geoStatus === 'success') &&
    (!requirePhoto || photoStatus === 'captured' || photoStatus === 'uploaded');

  const actionLabel = isClockIn ? 'Clock In' : 'Clock Out';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{actionLabel} Verification</DialogTitle>
          <DialogDescription>
            Please complete the following before {isClockIn ? 'clocking in' : 'clocking out'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Geolocation Section */}
          {requireGeo && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 font-medium text-sm">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
                {geoStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {geoStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {geoStatus === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
              </div>
              {geoStatus === 'success' && geoData && (
                <p className="text-xs text-muted-foreground">
                  {geoData.lat.toFixed(6)}, {geoData.lng.toFixed(6)} (±{Math.round(geoData.accuracy)}m)
                </p>
              )}
              {geoStatus === 'error' && (
                <div className="space-y-1">
                  <p className="text-xs text-destructive">{geoError}</p>
                  <Button size="sm" variant="outline" onClick={captureGeolocation}>
                    Retry
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Photo Section */}
          {requirePhoto && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 font-medium text-sm">
                <Camera className="h-4 w-4" />
                <span>Photo</span>
                {photoStatus === 'captured' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {photoStatus === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {photoStatus === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
              </div>

              {(photoStatus === 'camera' || photoStatus === 'idle') && (
                <div className="space-y-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-md bg-muted aspect-[4/3] object-cover"
                  />
                  <Button onClick={takePhoto} className="w-full" disabled={photoStatus === 'idle'}>
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                </div>
              )}

              {photoStatus === 'captured' && capturedImage && (
                <div className="space-y-2">
                  <img src={capturedImage} alt="Captured" className="w-full rounded-md aspect-[4/3] object-cover" />
                  <Button variant="outline" onClick={retakePhoto} className="w-full" size="sm">
                    Retake
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || externalLoading || photoStatus === 'uploading'}
          >
            {(externalLoading || photoStatus === 'uploading') && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Confirm {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClockCaptureDialog;
