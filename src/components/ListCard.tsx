import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Check, X, Square, CheckSquare, Eraser, Share2, UserMinus, UserX } from 'lucide-react';
import { List, ListItem, useListStore } from '../store/listStore';

interface ListCardProps {
  list: List;
}

export function ListCard({ list }: ListCardProps) {
  const { 
    deleteList, 
    updateList, 
    items, 
    fetchItems, 
    createItem, 
    updateItem, 
    deleteItem, 
    clearCompletedItems,
    shareList,
    unshareList,
    fetchSharedUsers,
    sharedUsers,
    removeSelfFromList
  } = useListStore();

  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(list.title);
  const [newItemContent, setNewItemContent] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareEmail, setShareEmail] = useState('');

  useEffect(() => {
    fetchItems(list.id);
    if (list.is_owner) {
      fetchSharedUsers(list.id);
    }
  }, [list.id, list.is_owner, fetchItems, fetchSharedUsers]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this list?')) {
      await deleteList(list.id);
    }
  };

  const handleUpdateTitle = async () => {
    if (newTitle.trim() && newTitle !== list.title) {
      await updateList(list.id, newTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemContent.trim()) {
      await createItem(list.id, newItemContent.trim());
      setNewItemContent('');
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    if (editingContent.trim()) {
      await updateItem(itemId, { content: editingContent.trim() });
    }
    setEditingItemId(null);
  };

  const handleToggleComplete = async (item: ListItem) => {
    await updateItem(item.id, { completed: !item.completed });
  };

  const handleClearCompleted = async () => {
    const completedItems = items[list.id]?.filter(item => item.completed) ?? [];
    if (completedItems.length === 0) return;

    if (window.confirm(`Are you sure you want to remove ${completedItems.length} completed item${completedItems.length === 1 ? '' : 's'}?`)) {
      await clearCompletedItems(list.id);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shareEmail.trim()) {
      try {
        await shareList(list.id, shareEmail.trim());
        setShareEmail('');
        setIsSharing(false);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to share list');
      }
    }
  };

  const handleUnshare = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this user from the shared list?')) {
      await unshareList(list.id, userId);
    }
  };

  const handleRemoveSelf = async () => {
    if (window.confirm('Are you sure you want to remove yourself from this shared list?')) {
      await removeSelfFromList(list.id);
    }
  };

  const listItems = items[list.id] ?? [];
  const completedCount = listItems.filter(item => item.completed).length;
  const totalCount = listItems.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const listUsers = sharedUsers[list.id] ?? [];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 ${
      list.is_shared ? 'border-l-4 border-indigo-500 dark:border-indigo-400' : ''
    }`}>
      <div className="flex flex-col mb-4">
        <div className="flex justify-between items-start">
          {isEditing ? (
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
              <button
                onClick={handleUpdateTitle}
                className="text-green-500 hover:text-green-600 dark:text-green-400"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNewTitle(list.title);
                }}
                className="text-red-500 hover:text-red-600 dark:text-red-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {list.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Created {new Date(list.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            {completedCount > 0 && (
              <button
                onClick={handleClearCompleted}
                className="text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400"
                title={`Clear ${completedCount} completed item${completedCount === 1 ? '' : 's'}`}
              >
                <Eraser className="h-5 w-5" />
              </button>
            )}
            {list.is_owner ? (
              <>
                <button
                  onClick={() => setIsSharing(true)}
                  className="text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400"
                  title="Share list"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400"
                  title="Edit list"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                  title="Delete list"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            ) : (
              <button
                onClick={handleRemoveSelf}
                className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                title="Remove yourself from this list"
              >
                <UserX className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2">
          {list.is_shared && !list.is_owner && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              Shared with you
            </span>
          )}
          {list.is_owner && listUsers.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Shared with {listUsers.length} {listUsers.length === 1 ? 'person' : 'people'}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {completedCount} of {totalCount} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out dark:bg-indigo-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {isSharing && list.is_owner && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Share List</h4>
          <form onSubmit={handleShare} className="flex flex-col gap-2">
            <input
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="Enter email to share with..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Share
              </button>
              <button
                type="button"
                onClick={() => setIsSharing(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
          {listUsers.length > 0 && (
            <div className="mt-4 space-y-2">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Shared with:</h5>
              {listUsers.map(user => (
                <div key={user.user_id} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded">
                  <span>{user.email}</span>
                  <button
                    onClick={() => handleUnshare(user.user_id)}
                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <form onSubmit={handleCreateItem} className="flex gap-2">
          <input
            type="text"
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            placeholder="Add new item..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="h-5 w-5" />
          </button>
        </form>

        <div className="space-y-2">
          {items[list.id]?.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <button
                onClick={() => handleToggleComplete(item)}
                className={`text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 ${
                  item.completed ? 'text-indigo-500 dark:text-indigo-400' : ''
                }`}
              >
                {item.completed ? (
                  <CheckSquare className="h-5 w-5" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>
              
              {editingItemId === item.id ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdateItem(item.id)}
                    className="text-green-500 hover:text-green-600 dark:text-green-400"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditingItemId(null)}
                    className="text-red-500 hover:text-red-600 dark:text-red-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center flex-1">
                  <span className={`flex-1 ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    {item.content}
                  </span>
                  <button
                    onClick={() => {
                      setEditingItemId(item.id);
                      setEditingContent(item.content);
                    }}
                    className="text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id, list.id)}
                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}