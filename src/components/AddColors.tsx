import React, { useState } from 'react';
import useGetAllModels from '../hooks/useGetAllModels';
import useGetAllCollections from '../hooks/useGetAllCollections';
import usePostColors from '../hooks/usePostColors';
import { useUpdateColor } from '../hooks/useUpdateColor';
import { useDeleteColor } from '../hooks/useDeleteColor';
import { useUploadColorImage } from '../hooks/useUploadColorImage';
import type { Color } from '../types';

const AddColors: React.FC = () => {
  const { data: models = [] } = useGetAllModels();
  const { data: collections = [] } = useGetAllCollections();
  
  const createColor = usePostColors();
  const updateColor = useUpdateColor();
  const deleteColor = useDeleteColor();
  const uploadImage = useUploadColorImage();

  // Form State
  const [modelId, setModelId] = useState('');
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#ffc35c');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [filterModelId, setFilterModelId] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);

  // Sync filter when parent model is selected in the form
  React.useEffect(() => {
    if (modelId) {
      setFilterModelId(modelId);
    }
  }, [modelId]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !modelId || !sku.trim()) {
      showStatus('Please specify Color Name, SKU, and Model', 'error');
      return;
    }

    const colorPayload: Partial<Color> = {
      name,
      hex,
      sku,
      description: description || null,
      modelId,
    };

    try {
      if (editingId) {
        await updateColor.mutateAsync({ id: editingId, data: colorPayload });
        showStatus('Color variant updated successfully!');
      } else {
        await createColor.mutateAsync(colorPayload);
        showStatus('Color variant created successfully!');
      }
      handleCancel();
    } catch (err: unknown) {
      showStatus(String(err), 'error');
    }
  };

  const handleEdit = (color: Color) => {
    if (!color.id) return;
    setEditingId(color.id);
    setName(color.name);
    setHex(color.hex);
    setSku(color.sku);
    setDescription(color.description || '');
    setModelId(color.modelId);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this color?')) return;
    try {
      await deleteColor.mutateAsync(id);
      showStatus('Color variant deleted successfully!');
    } catch (err: unknown) {
      showStatus(String(err), 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setHex('#ffc35c');
    setSku('');
    setDescription('');
  };

  const handleFileUpload = async (colorId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await uploadImage.mutateAsync({ id: colorId, formData });
      showStatus('Color swatch image uploaded successfully!');
    } catch (err: unknown) {
      showStatus(`Upload failed: ${String(err)}`, 'error');
    }
  };

  // Flatten colors from models to list them
  const colorsList: Color[] = [];
  collections.forEach((collection) => {
    if (collection.models && Array.isArray(collection.models)) {
      collection.models.forEach((model) => {
        if (model.colors && Array.isArray(model.colors)) {
          model.colors.forEach((color) => {
            if (!colorsList.some((c) => c.id === color.id)) {
              if (!filterModelId || color.modelId === filterModelId) {
                colorsList.push(color);
              }
            }
          });
        }
      });
    }
  });

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Colors Management</h1>
        <p className="dashboard-subtitle">Configure color options (swatches, hex, SKU codes) for existing 3D models.</p>
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
          <h2 className="card-title">{editingId ? 'Edit Color Option' : 'Create Color Option'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Parent Model</label>
              <select
                className="form-select"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                required
              >
                <option value="">-- Select Model --</option>
                {models.map((m) => {
                  const collName = collections.find((c) => c.id === m.collectionId)?.name || 'Unknown Collection';
                  return (
                    <option key={m.id} value={m.id}>
                      {m.name} ({collName})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Color Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Yellow Gold, White Gold, Rose Gold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hex Color Code</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="color"
                    style={{ width: '45px', height: '42px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="#ffffff"
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Reference</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ref 174-A"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Color specific information..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                disabled={createColor.isPending || updateColor.isPending}
              >
                {editingId ? 'Save Changes' : 'Create Color'}
              </button>
            </div>
          </form>
        </div>

        {/* List Panel */}
        <div className="card-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Existing Color Variants</h2>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              value={filterModelId}
              onChange={(e) => setFilterModelId(e.target.value)}
            >
              <option value="">All Models</option>
              {models.map((m) => {
                const collName = collections.find((c) => c.id === m.collectionId)?.name || 'Unknown Collection';
                return (
                  <option key={m.id} value={m.id}>
                    {m.name} ({collName})
                  </option>
                );
              })}
            </select>
          </div>
          {colorsList.length === 0 ? (
            <div className="empty-state">No color variants found. Add colors to your models.</div>
          ) : (
            <div className="list-container">
              {colorsList.map((color) => {
                const parentModel = models.find((m) => m.id === color.modelId);
                const parentModelName = parentModel ? parentModel.name : 'Unknown Model';
                return (
                  <div key={color.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {color.image ? (
                          <img src={color.image} alt={color.name} className="list-item-img" />
                        ) : (
                          <div className="list-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                            <span className="color-dot" style={{ backgroundColor: color.hex, width: '24px', height: '24px' }}></span>
                          </div>
                        )}
                        <div>
                          <h3 className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {color.name}
                            <span className="color-dot" style={{ backgroundColor: color.hex }}></span>
                          </h3>
                          <p className="list-item-subtitle" style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 500 }}>
                            Model: {parentModelName} • SKU: {color.sku}
                          </p>
                        </div>
                      </div>

                      <div className="list-item-actions">
                        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleEdit(color)}>
                          Edit
                        </button>
                        {color.id && (
                          <button
                            className="btn btn-danger-outline"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                            onClick={() => handleDelete(color.id!)}
                            disabled={deleteColor.isPending}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Image swatch uploads */}
                    {color.id && (
                      <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                        <span className="form-label" style={{ fontSize: '0.75rem' }}>Upload Swatch Image</span>
                        <div className="file-upload-zone" style={{ padding: '0.5rem', minHeight: '60px' }}>
                          <span className="file-upload-text" style={{ fontSize: '0.75rem' }}>Select file to upload to S3</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="file-upload-input"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(color.id!, file);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddColors;
