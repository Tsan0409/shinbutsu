'use client';

import { useState, useEffect } from 'react';
import { customerApi, Customer, CustomerRequest } from '@/lib/api';

export default function Home() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CustomerRequest>({
    id: '',
    username: '',
    email: '',
    phoneNumber: '',
    postCode: '',
  });

  // 顧客一覧を取得
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching customers from API...');
      const data = await customerApi.getAll();
      console.log('Customers fetched:', data);
      setCustomers(data);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      const errorMessage = err.response?.data?.message || err.message || 'データの取得に失敗しました';
      setError(`${errorMessage} (APIサーバーが起動しているか確認してください)`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // フォームのリセット
  const resetForm = () => {
    setFormData({
      id: '',
      username: '',
      email: '',
      phoneNumber: '',
      postCode: '',
    });
    setIsCreateMode(false);
    setEditingId(null);
  };

  // 作成ボタン
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await customerApi.create(formData);
      await fetchCustomers();
      resetForm();
      alert('顧客を作成しました');
    } catch (err: any) {
      setError(err.response?.data?.message || '作成に失敗しました');
    }
  };

  // 更新ボタン
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    
    try {
      setError(null);
      const { id, ...updateData } = formData;
      await customerApi.update(editingId, updateData);
      await fetchCustomers();
      resetForm();
      alert('顧客を更新しました');
    } catch (err: any) {
      setError(err.response?.data?.message || '更新に失敗しました');
    }
  };

  // 削除ボタン
  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか?')) return;
    
    try {
      setError(null);
      await customerApi.delete(id);
      await fetchCustomers();
      alert('顧客を削除しました');
    } catch (err: any) {
      setError(err.response?.data?.message || '削除に失敗しました');
    }
  };

  // 編集モードに切り替え
  const startEdit = (customer: Customer) => {
    setFormData({
      id: customer.id,
      username: customer.username,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      postCode: customer.postCode,
    });
    setEditingId(customer.id);
    setIsCreateMode(false);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Customer Management Demo</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* 作成・編集フォーム */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              {editingId ? '顧客編集' : isCreateMode ? '新規顧客作成' : ''}
            </h2>
            {!isCreateMode && !editingId && (
              <button
                onClick={() => setIsCreateMode(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                新規作成
              </button>
            )}
            {(isCreateMode || editingId) && (
              <button
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                キャンセル
              </button>
            )}
          </div>

          {(isCreateMode || editingId) && (
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
              {isCreateMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID *
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    maxLength={10}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ユーザー名 *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号 * (10桁または11桁)
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  pattern="[0-9]{10,11}"
                  placeholder="09012345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  郵便番号 * (7桁)
                </label>
                <input
                  type="text"
                  value={formData.postCode}
                  onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  pattern="[0-9]{7}"
                  placeholder="1234567"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
              >
                {editingId ? '更新' : '作成'}
              </button>
            </form>
          )}
        </div>

        {/* 顧客一覧 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">顧客一覧</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          ) : customers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">顧客データがありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">ID</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">ユーザー名</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">メールアドレス</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">電話番号</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">郵便番号</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{customer.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{customer.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{customer.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{customer.phoneNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{customer.postCode}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => startEdit(customer)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2 text-xs"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* API接続情報 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">API接続情報</h3>
          <p className="text-sm text-blue-800">
            エンドポイント: <code className="bg-blue-100 px-2 py-1 rounded">http://localhost:8080/api/customers</code>
          </p>
          <p className="text-sm text-blue-800 mt-1">
            バックエンドが起動していることを確認してください
          </p>
        </div>
      </div>
    </main>
  );
}
