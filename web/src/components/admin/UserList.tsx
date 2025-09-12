"use client";

interface UserListProps {
  users: any[];
  loading: boolean;
  onSelectUser: (id: number) => void;
}

export default function UserList({
  users,
  loading,
  onSelectUser,
}: UserListProps) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Users</h2>
      {loading && (
        <div className="text-gray-600 dark:text-gray-400">Loading users...</div>
      )}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div>
              <div className="font-medium">{user.username}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {user.email} • ID: {user.id}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
            <button
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
              onClick={() => onSelectUser(user.id)}
            >
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
