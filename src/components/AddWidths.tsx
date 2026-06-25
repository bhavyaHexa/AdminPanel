import React, { useState } from 'react';
import useGetAllCollections from '../hooks/useGetAllCollections';
import usePostWidths from '../hooks/usePostWidths';
import { useUpdateWidth } from '../hooks/useUpdateWidth';
import { useDeleteWidth } from '../hooks/useDeleteWidth';
import { useDeletePriceList } from '../hooks/useDeletePriceList';
import { useDeleteTexture } from '../hooks/useDeleteTexture';
import { useDeleteAsset3D } from '../hooks/useDeleteAsset3D';
import type { Width, Color } from '../types';

const AddWidths: React.FC = () => {
  const { data: collections = [] } = useGetAllCollections();
  
  const createWidth = usePostWidths();
  const updateWidth = useUpdateWidth();
  const deleteWidth = useDeleteWidth();
  const deletePriceList = useDeletePriceList();
  const deleteTexture = useDeleteTexture();
  const deleteAsset3D = useDeleteAsset3D();

  // Form State
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [colorId, setColorId] = useState('');
  const [value, setValue] = useState('2.5');

  // Derived options based on granular selection
  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);
  const modelsOptions = selectedCollection?.models || [];
  const selectedModel = modelsOptions.find((m) => m.id === selectedModelId);
  const colorsOptions = selectedModel?.colors || [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || !colorId) {
      showStatus('Please specify Width Value and Color Variant', 'error');
      return;
    }

    const isDuplicate = widthsList.some(
      (w) => w.width.colorId === colorId && w.width.value.trim() === value.trim() && w.width.id !== editingId
    );
    if (isDuplicate) {
      alert('Width already created');
      showStatus('Width already created', 'error');
      return;
    }

    const widthPayload: Partial<Width> = {
      value,
      colorId,
    };

    try {
      if (editingId) {
        await updateWidth.mutateAsync({ id: editingId, data: widthPayload });
        showStatus('Width dimension updated successfully!');
      } else {
        await createWidth.mutateAsync(widthPayload);
        showStatus('Width dimension created successfully!');
      }
      handleCancel();
    } catch (err: unknown) {
      showStatus(String(err), 'error');
    }
  };

  const handleEdit = (width: Width) => {
    if (!width.id) return;
    setEditingId(width.id);
    setValue(width.value);
    setColorId(width.colorId);

    // Find parent model and collection for the selected colorId to pre-populate selection states
    let foundCollectionId = '';
    let foundModelId = '';
    collections.forEach((collection) => {
      if (collection.models && Array.isArray(collection.models)) {
        collection.models.forEach((model) => {
          if (model.colors && Array.isArray(model.colors)) {
            if (model.colors.some((c) => c.id === width.colorId)) {
              foundCollectionId = collection.id || '';
              foundModelId = model.id || '';
            }
          }
        });
      }
    });
    setSelectedCollectionId(foundCollectionId);
    setSelectedModelId(foundModelId);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this width and all its configurations?')) return;
    try {
      showStatus('Deleting width variant and all associated configurations... Please wait.', 'success');

      // Find the fully populated width from the collections array
      let fullWidth: Width | undefined;
      for (const c of collections) {
        if (c.models) {
          for (const m of c.models) {
            if (m.colors) {
              for (const col of m.colors) {
                if (col.widths) {
                  const found = col.widths.find((w) => w.id === id);
                  if (found) {
                    fullWidth = found;
                    break;
                  }
                }
              }
            }
            if (fullWidth) break;
          }
        }
        if (fullWidth) break;
      }

      const targetWidth = fullWidth;
      if (targetWidth) {
        // Delete price lists
        if (targetWidth.priceLists && targetWidth.priceLists.length > 0) {
          for (const price of targetWidth.priceLists) {
            if (price.id) {
              await deletePriceList.mutateAsync(price.id);
            }
          }
        }
        // Delete texture
        if (targetWidth.texture && targetWidth.texture.id) {
          await deleteTexture.mutateAsync(targetWidth.texture.id);
        }
        // Delete asset3d
        if (targetWidth.asset3D && targetWidth.asset3D.id) {
          await deleteAsset3D.mutateAsync(targetWidth.asset3D.id);
        }
      }

      await deleteWidth.mutateAsync(id);
      showStatus('Width variant deleted successfully!');
    } catch (err: unknown) {
      showStatus(String(err), 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setValue('2.5');
    setSelectedCollectionId('');
    setSelectedModelId('');
    setColorId('');
  };

  // Traverse all models -> colors to fetch color details and colors list
  const colorsList: { color: Color; modelName: string; collectionName: string }[] = [];
  const widthsList: { width: Width; colorName: string; hex: string; modelName: string; collectionName: string }[] = [];

  // Filter states for width list
  const [filterCollectionId, setFilterCollectionId] = useState('');

  const [filterModelId, setFilterModelId] = useState('');
  const [filterColorId, setFilterColorId] = useState('');

  React.useEffect(() => {
    setFilterCollectionId(selectedCollectionId);
    setFilterModelId(selectedModelId);
    setFilterColorId(colorId);
  }, [selectedCollectionId, selectedModelId, colorId]);

  collections.forEach((collection) => {
    if (collection.models && Array.isArray(collection.models)) {
      collection.models.forEach((model) => {
        if (model.colors && Array.isArray(model.colors)) {
          model.colors.forEach((color) => {
            colorsList.push({ color, modelName: model.name, collectionName: collection.name });
            if (color.widths && Array.isArray(color.widths)) {
              color.widths.forEach((width) => {
                widthsList.push({
                  width,
                  colorName: color.name,
                  hex: color.hex,
                  modelName: model.name,
                  collectionName: collection.name,
                });
              });
            }
          });
        }
      });
    }
  });

  // Apply filters to widthsList
  const filteredWidths = widthsList.filter(({ width }) => {
    const matchesCollection = filterCollectionId ? width.colorId && colorsList.find(c => c.color.id === width.colorId)?.collectionName && collections.find(c => c.id === filterCollectionId)?.name === colorsList.find(c => c.color.id === width.colorId)?.collectionName : true;
    const matchesModel = filterModelId ? colorsList.find(c => c.color.id === width.colorId)?.modelName === modelsOptions.find(m => m.id === filterModelId)?.name : true;
    const matchesColor = filterColorId ? width.colorId === filterColorId : true;
    return matchesCollection && matchesModel && matchesColor;
  });


  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Widths Management</h1>
        <p className="dashboard-subtitle">Define physical widths (in millimeters) associated with specific gold or metal color variants.</p>
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
          <h2 className="card-title">{editingId ? 'Edit Width Option' : 'Create Width Option'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Collection</label>
              <select
                className="form-select"
                value={selectedCollectionId}
                onChange={(e) => {
                  setSelectedCollectionId(e.target.value);
                  setSelectedModelId('');
                  setColorId('');
                }}
                required
              >
                <option value="">-- Select Collection --</option>
                {collections.map((coll) => (
                  <option key={coll.id} value={coll.id}>
                    {coll.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Model</label>
              <select
                className="form-select"
                value={selectedModelId}
                onChange={(e) => {
                  setSelectedModelId(e.target.value);
                  setColorId('');
                }}
                disabled={!selectedCollectionId}
                required
              >
                <option value="">-- Select Model --</option>
                {modelsOptions.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Color Variant</label>
              <select
                className="form-select"
                value={colorId}
                onChange={(e) => setColorId(e.target.value)}
                disabled={!selectedModelId}
                required
              >
                <option value="">-- Select Color --</option>
                {colorsOptions.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name} ({color.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Width Value (mm)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 2, 2.5, 3, 4.5"
                value={value}
                onChange={(e) => setValue(e.target.value)}
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
                disabled={createWidth.isPending || updateWidth.isPending}
              >
                {editingId ? 'Save Changes' : 'Create Width'}
              </button>
            </div>
          </form>
        </div>

        {/* List Panel */}
        <div className="card-panel">
          {/* Filter Controls */}
          <div className="card-panel">
            <h2 className="card-title">Filter Widths</h2>
            <div className="form-group">
              <label className="form-label">Collection</label>
              <select
                className="form-select"
                value={filterCollectionId}
                onChange={(e) => {
                  setFilterCollectionId(e.target.value);
                  setFilterModelId('');
                  setFilterColorId('');
                }}
              >
                <option value="">-- All Collections --</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <select
                className="form-select"
                value={filterModelId}
                onChange={(e) => {
                  setFilterModelId(e.target.value);
                  setFilterColorId('');
                }}
                disabled={!filterCollectionId}
              >
                <option value="">-- All Models --</option>
                {collections
                  .find((c) => c.id === filterCollectionId)
                  ?.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <select
                className="form-select"
                value={filterColorId}
                onChange={(e) => setFilterColorId(e.target.value)}
                disabled={!filterModelId}
              >
                <option value="">-- All Colors --</option>
                {colorsOptions
                  .filter((c) => {
                    if (filterModelId) {
                      const model = modelsOptions.find((m) => m.id === filterModelId);
                      return model?.colors?.some((col) => col.id === c.id);
                    }
                    return true;
                  })
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.sku})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="card-panel">
            <h2 className="card-title">Existing Width Specifications</h2>
            {filteredWidths.length === 0 ? (
              <div className="empty-state">No widths found. Add widths to your color variants.</div>
            ) : (
              <div className="list-container">
                {filteredWidths.map(({ width, colorName, hex, modelName }) => (
                  <div key={width.id} className="list-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <div className="list-item-img" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', fontWeight: 'bold', color: '#10b981' }}>
                        {width.value}
                        <span style={{ fontSize: '0.65rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>mm</span>
                      </div>
                      <div>
                        <h3 className="list-item-title">Width: {width.value} mm</h3>
                        <p className="list-item-subtitle" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          Color: {colorName}
                          <span className="color-dot" style={{ backgroundColor: hex }}></span>
                          • Model: {modelName}
                        </p>
                      </div>
                    </div>

                    <div className="list-item-actions">
                      <button className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleEdit(width)}>
                        Edit
                      </button>
                      {width.id && (
                        <button
                          className="btn btn-danger-outline"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          onClick={() => handleDelete(width.id!)}
                          disabled={deleteWidth.isPending}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWidths;
