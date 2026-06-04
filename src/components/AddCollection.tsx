import React, { useState } from 'react';
import useGetAllCollections from '../hooks/useGetAllCollections';
import usePostCollection from '../hooks/usePostCollection';
import { useUpdateCollection } from '../hooks/useUpdateCollection';
import { useDeleteCollection } from '../hooks/useDeleteCollection';
import { useUploadCollectionImage } from '../hooks/useUploadCollectionImage';
import { useUploadCollectionPreview } from '../hooks/useUploadCollectionPreview';
import { useDeleteModel } from '../hooks/useDeleteModel';
import { useDeleteColor } from '../hooks/useDeleteColor';
import { useDeleteWidth } from '../hooks/useDeleteWidth';
import { useDeletePriceList } from '../hooks/useDeletePriceList';
import { useDeleteTexture } from '../hooks/useDeleteTexture';
import type { Collection } from '../types';

const AddCollection: React.FC = () => {
  const { data: collections = [], isLoading, error } = useGetAllCollections();
  const createCollection = usePostCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const deleteModel = useDeleteModel();
  const deleteColor = useDeleteColor();
  const deleteWidth = useDeleteWidth();
  const deletePriceList = useDeletePriceList();
  const deleteTexture = useDeleteTexture();
  const uploadImage = useUploadCollectionImage();
  const uploadPreview = useUploadCollectionPreview();

  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const isDuplicate = collections.some(
      (c) => c.name.toLowerCase().trim() === name.toLowerCase().trim() && c.id !== editingId
    );
    if (isDuplicate) {
      alert('Collection already created');
      showStatus('Collection already created', 'error');
      return;
    }

    try {
      if (editingId) {
        await updateCollection.mutateAsync({
          id: editingId,
          data: { name },
        });
        showStatus('Collection updated successfully!');
      } else {
        await createCollection.mutateAsync({ name });
        showStatus('Collection created successfully!');
      }
      handleCancel();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || String(err);
      showStatus(errMsg, 'error');
    }
  };

  const handleEdit = (collection: Collection) => {
    if (!collection.id) return;
    setEditingId(collection.id);
    setName(collection.name);
  };

  const handleDelete = async (collection: Collection) => {
    if (!collection.id) return;
    if (
      !window.confirm(
        `Are you sure you want to delete collection "${collection.name}" and all its models and configurations?`,
      )
    )
      return;

    try {
      showStatus(
        "Deleting collection and all its associated models and configurations... Please wait.",
        "success",
      );

      // Cascade delete models
      if (collection.models && collection.models.length > 0) {
        for (const model of collection.models) {
          // Cascade delete model configurations
          if (model.colors && model.colors.length > 0) {
            for (const color of model.colors) {
              if (color.widths && color.widths.length > 0) {
                for (const width of color.widths) {
                  if (width.priceLists && width.priceLists.length > 0) {
                    for (const price of width.priceLists) {
                      if (price.id) await deletePriceList.mutateAsync(price.id);
                    }
                  }
                  if (width.texture && width.texture.id) {
                    await deleteTexture.mutateAsync(width.texture.id);
                  }
                  if (width.id) await deleteWidth.mutateAsync(width.id);
                }
              }
              if (color.id) await deleteColor.mutateAsync(color.id);
            }
          }
          if (model.id) await deleteModel.mutateAsync(model.id);
        }
      }

      // Finally delete collection itself
      await deleteCollection.mutateAsync(collection.id);
      showStatus("Collection deleted successfully!");
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        String(err);
      showStatus(errMsg, "error");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
  };

  const handleFileUpload = async (collectionId: string, file: File, type: 'image' | 'preview') => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      if (type === 'image') {
        await uploadImage.mutateAsync({ id: collectionId, formData });
        showStatus('Collection cover image uploaded successfully!');
      } else {
        await uploadPreview.mutateAsync({ id: collectionId, formData });
        showStatus('Collection preview uploaded successfully!');
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || String(err);
      showStatus(`Upload failed: ${errMsg}`, 'error');
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Collections Management</h1>
        <p className="dashboard-subtitle">Manage collections, upload graphics, and link models.</p>
      </div>

      {statusMsg && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: statusMsg.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.9rem',
          }}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Form Panel */}
        <div className="card-panel">
          <h2 className="card-title">{editingId ? 'Edit Collection' : 'Create Collection'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Collection Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Artisanal, Silver Heart"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="btn-group">
              {editingId && (
                <button type="button" className="btn btn-ghost" onClick={handleCancel}>
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createCollection.isPending || updateCollection.isPending}
              >
                {editingId ? 'Save Changes' : 'Create Collection'}
              </button>
            </div>
          </form>
        </div>

        {/* List Panel */}
        <div className="card-panel">
          <h2 className="card-title">Existing Collections</h2>
          {isLoading ? (
            <div className="empty-state">Loading collections...</div>
          ) : error ? (
            <div className="empty-state" style={{ color: '#ef4444' }}>
              Error loading collections: {error.message}
            </div>
          ) : collections.length === 0 ? (
            <div className="empty-state">No collections found. Create one to get started.</div>
          ) : (
            <div className="list-container">
              {collections.map((collection) => (
                <div key={collection.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {collection.image ? (
                        <img src={collection.image} alt={collection.name} className="list-item-img" />
                      ) : (
                        <div className="list-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', fontSize: '1.5rem' }}>
                          📁
                        </div>
                      )}
                      <div>
                        <h3 className="list-item-title">{collection.name}</h3>
                        <p className="list-item-subtitle">{collection.models?.length || 0} Models linked</p>
                      </div>
                    </div>

                    <div className="list-item-actions">
                      <button className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleEdit(collection)}>
                        Edit
                      </button>
                      {collection.id && (
                        <button
                          className="btn btn-danger-outline"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          onClick={() => handleDelete(collection)}
                          disabled={
                            deleteCollection.isPending ||
                            deleteModel.isPending ||
                            deleteColor.isPending ||
                            deleteWidth.isPending ||
                            deletePriceList.isPending ||
                            deleteTexture.isPending
                          }
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Image upload options */}
                  {collection.id && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                      <div>
                        <span className="form-label" style={{ fontSize: '0.75rem' }}>Cover Image</span>
                        <div className="file-upload-zone" style={{ padding: '0.5rem', minHeight: '60px' }}>
                          <span className="file-upload-text" style={{ fontSize: '0.75rem' }}>Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="file-upload-input"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(collection.id!, file, 'image');
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <span className="form-label" style={{ fontSize: '0.75rem' }}>Preview Image</span>
                        <div className="file-upload-zone" style={{ padding: '0.5rem', minHeight: '60px' }}>
                          <span className="file-upload-text" style={{ fontSize: '0.75rem' }}>Upload Preview</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="file-upload-input"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(collection.id!, file, 'preview');
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCollection;
