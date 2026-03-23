import { useState } from 'react';
import { User } from '../../services/user.service';

interface PermissionEditorProps {
  user: User | null;
  onSave: (user: User) => void;
  onCancel: () => void;
}

export default function PermissionEditor({ user, onSave, onCancel }: PermissionEditorProps) {
  if (!user) return null;

  const [role, setRole] = useState<User['role']>(user.role);

  const handleSave = () => {
    onSave({ ...user, role });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rôle
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as User['role'])}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="employee">Utilisateur</option>
          <option value="admin">Administrateur</option>
          <option value="accountant">Expert Comptable</option>
        </select>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

