import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface List {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  is_shared?: boolean;
  is_owner?: boolean;
}

export interface ListItem {
  id: string;
  list_id: string;
  content: string;
  completed: boolean;
  created_at: string;
}

export interface SharedUser {
  email: string;
  user_id: string;
}

interface ListState {
  lists: List[];
  items: Record<string, ListItem[]>;
  sharedUsers: Record<string, SharedUser[]>;
  loading: boolean;
  error: string | null;
  createList: (title: string) => Promise<void>;
  updateList: (id: string, title: string) => Promise<void>;
  fetchLists: () => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  createItem: (listId: string, content: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<Omit<ListItem, 'id' | 'list_id' | 'created_at'>>) => Promise<void>;
  deleteItem: (id: string, listId: string) => Promise<void>;
  fetchItems: (listId: string) => Promise<void>;
  clearCompletedItems: (listId: string) => Promise<void>;
  shareList: (listId: string, email: string) => Promise<void>;
  unshareList: (listId: string, userId: string) => Promise<void>;
  fetchSharedUsers: (listId: string) => Promise<void>;
  removeSelfFromList: (listId: string) => Promise<void>;
}

export const useListStore = create<ListState>((set, get) => ({
  lists: [],
  items: {},
  sharedUsers: {},
  loading: false,
  error: null,

  createList: async (title: string) => {
    try {
      set({ loading: true, error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('lists')
        .insert([{ title, user_id: user.user.id }]);

      if (error) throw error;
      await get().fetchLists();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  updateList: async (id: string, title: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('lists')
        .update({ title })
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        lists: state.lists.map(list => 
          list.id === id ? { ...list, title } : list
        )
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  fetchLists: async () => {
    try {
      set({ loading: true, error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // First, get all list IDs that are shared with the user
      const { data: sharedListIds, error: sharedIdsError } = await supabase
        .from('shared_lists')
        .select('list_id')
        .eq('shared_with', user.user.id);

      if (sharedIdsError) throw sharedIdsError;

      // Extract the list IDs from the result
      const listIds = sharedListIds?.map(item => item.list_id) || [];

      // Fetch owned lists
      const { data: ownedLists, error: ownedError } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (ownedError) throw ownedError;

      // Fetch shared lists if there are any
      let sharedLists: List[] = [];
      if (listIds.length > 0) {
        const { data: sharedData, error: sharedError } = await supabase
          .from('lists')
          .select('*')
          .in('id', listIds)
          .order('created_at', { ascending: false });

        if (sharedError) throw sharedError;
        sharedLists = sharedData || [];
      }

      const lists = [
        ...(ownedLists?.map(list => ({ ...list, is_owner: true, is_shared: false })) || []),
        ...(sharedLists.map(list => ({ ...list, is_shared: true, is_owner: false })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      set({ lists });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  deleteList: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        lists: state.lists.filter(list => list.id !== id),
        items: { ...state.items, [id]: [] }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  createItem: async (listId: string, content: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('list_items')
        .insert([{ list_id: listId, content }]);

      if (error) throw error;
      await get().fetchItems(listId);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  updateItem: async (id: string, updates: Partial<Omit<ListItem, 'id' | 'list_id' | 'created_at'>>) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('list_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      set(state => {
        const listId = Object.entries(state.items).find(([, items]) => 
          items.some(item => item.id === id)
        )?.[0];

        if (!listId) return state;

        return {
          ...state,
          items: {
            ...state.items,
            [listId]: state.items[listId].map(item =>
              item.id === id ? { ...item, ...updates } : item
            )
          }
        };
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  deleteItem: async (id: string, listId: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        items: {
          ...state.items,
          [listId]: state.items[listId].filter(item => item.id !== id)
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  fetchItems: async (listId: string) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set(state => ({
        items: {
          ...state.items,
          [listId]: data as ListItem[]
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  clearCompletedItems: async (listId: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', listId)
        .eq('completed', true);

      if (error) throw error;
      
      set(state => ({
        items: {
          ...state.items,
          [listId]: state.items[listId].filter(item => !item.completed)
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  shareList: async (listId: string, email: string) => {
    try {
      set({ loading: true, error: null });
      
      // Get the user ID by querying the users table through RPC
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_id_by_email', { email_input: email });

      if (userError) throw new Error('Failed to find user');
      if (!userData) throw new Error('User not found');

      // Then create the share
      const { error: shareError } = await supabase
        .from('shared_lists')
        .insert([{ list_id: listId, shared_with: userData }]);

      if (shareError) throw shareError;

      await get().fetchSharedUsers(listId);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  unshareList: async (listId: string, userId: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('shared_lists')
        .delete()
        .eq('list_id', listId)
        .eq('shared_with', userId);

      if (error) throw error;
      await get().fetchSharedUsers(listId);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  fetchSharedUsers: async (listId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data: users, error: usersError } = await supabase
        .rpc('get_shared_users', { list_id_input: listId });

      if (usersError) throw usersError;

      const sharedUsers = users?.map(user => ({
        user_id: user.user_id,
        email: user.user_email
      })) || [];

      set(state => ({
        sharedUsers: {
          ...state.sharedUsers,
          [listId]: sharedUsers
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  removeSelfFromList: async (listId: string) => {
    try {
      set({ loading: true, error: null });
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('shared_lists')
        .delete()
        .eq('list_id', listId)
        .eq('shared_with', user.user.id);

      if (error) throw error;

      // Remove the list from the local state
      set(state => ({
        lists: state.lists.filter(list => list.id !== listId),
        items: { ...state.items, [listId]: [] }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  }
}));