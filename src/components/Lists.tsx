import React, { useEffect } from 'react';
import { useListStore } from '../store/listStore';
import { CreateList } from './CreateList';
import { ListCard } from './ListCard';

export function Lists() {
  const { lists, loading, error, fetchLists } = useListStore();

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  if (loading && lists.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CreateList />
      {lists.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No lists yet. Create your first list to get started!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map(list => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}