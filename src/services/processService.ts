
import { supabase } from "@/integrations/supabase/client";

export interface MenuSet {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  label: string;
  processId: string;
}

export interface Process {
  id: string;
  name: string;
  description: string;
  type: 'form' | 'list' | 'dashboard';
  menuSetId?: string;
}

export const processService = {
  async getMenuSets(): Promise<MenuSet[]> {
    const { data, error } = await supabase
      .from('menu_sets')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching menu sets:', error);
      throw error;
    }

    return (data || []).map(set => ({
      id: set.id,
      name: set.name,
      description: set.description,
      items: Array.isArray(set.items) ? set.items : []
    }));
  },

  async getProcesses(): Promise<Process[]> {
    const { data, error } = await supabase
      .from('processes')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching processes:', error);
      throw error;
    }

    return (data || []).map(process => ({
      id: process.id,
      name: process.name,
      description: process.description,
      type: process.type as 'form' | 'list' | 'dashboard',
      menuSetId: process.menu_set_id || undefined
    }));
  },

  async getProcessById(id: string): Promise<Process | null> {
    const { data, error } = await supabase
      .from('processes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching process:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type as 'form' | 'list' | 'dashboard',
      menuSetId: data.menu_set_id || undefined
    };
  },

  async createMenuSet(menuSet: Omit<MenuSet, 'id'>): Promise<MenuSet> {
    const { data, error } = await supabase
      .from('menu_sets')
      .insert({
        name: menuSet.name,
        description: menuSet.description,
        items: menuSet.items
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating menu set:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      items: Array.isArray(data.items) ? data.items : []
    };
  },

  async createProcess(process: Omit<Process, 'id'>): Promise<Process> {
    const { data, error } = await supabase
      .from('processes')
      .insert({
        name: process.name,
        description: process.description,
        type: process.type,
        menu_set_id: process.menuSetId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating process:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type as 'form' | 'list' | 'dashboard',
      menuSetId: data.menu_set_id || undefined
    };
  }
};
