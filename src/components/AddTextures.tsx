import React, { useState } from 'react';
import useGetAllCollections from '../hooks/useGetAllCollections';
import usePostTextures from '../hooks/usePostTextures';
import { useUploadTextureAoGold } from '../hooks/useUploadTextureAoGold';
import { useUploadTextureAoSilver } from '../hooks/useUploadTextureAoSilver';
import { useUploadTextureAoEngrave } from '../hooks/useUploadTextureAoEngrave';
import { useUploadTextureNormalBase } from '../hooks/useUploadTextureNormalBase';
import { useUploadTextureNormalFinishing } from '../hooks/useUploadTextureNormalFinishing';
import { useUpdateTexture } from '../hooks/useUpdateTexture';
import { useDeleteTexture } from '../hooks/useDeleteTexture';
import type { Width, Texture } from '../types';

const AddTextures: React.FC = () => {
  const { data: collections = [] } = useGetAllCollections();

  const createTexture = usePostTextures();
  const updateTexture = useUpdateTexture();
  const deleteTexture = useDeleteTexture();
  const uploadGold = useUploadTextureAoGold();
  const uploadSilver = useUploadTextureAoSilver();
  const uploadEngrave = useUploadTextureAoEngrave();
  const uploadNormalBase = useUploadTextureNormalBase();
  const uploadNormalFinishing = useUploadTextureNormalFinishing();

  // Form State
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedColorId, setSelectedColorId] = useState('');
  const [widthId, setWidthId] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter State
  const [filterCollectionId, setFilterCollectionId] = useState('');
  const [filterModelId, setFilterModelId] = useState('');
  const [filterColorId, setFilterColorId] = useState('');

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleUploadClick = async (file: File, type: 'gold' | 'silver' | 'engrave' | 'normalBase' | 'normalFinishing') => {
    if (!widthId) return;
    try {
      let textureId = currentTexture?.id;
      if (!textureId) {
        const created = await createTexture.mutateAsync({ widthId });
        textureId = created.id;
      }
      if (textureId) {
        await handleMapUpload(textureId, file, type);
      }
    } catch (err: unknown) {
      showStatus(`Upload failed: ${String(err)}`, 'error');
    }
  };

  const handleEdit = (texture: Texture) => {
    if (!texture.id) return;
    
    // Find parent color, model, and collection for this widthId
    let foundCollectionId = '';
    let foundModelId = '';
    let foundColorId = '';
    collections.forEach((collection) => {
      if (collection.models && Array.isArray(collection.models)) {
        collection.models.forEach((model) => {
          if (model.colors && Array.isArray(model.colors)) {
            model.colors.forEach((color) => {
              if (color.widths && Array.isArray(color.widths)) {
                if (color.widths.some((w) => w.id === texture.widthId)) {
                  foundCollectionId = collection.id || '';
                  foundModelId = model.id || '';
                  foundColorId = color.id || '';
                }
              }
            });
          }
        });
      }
    });
    setSelectedCollectionId(foundCollectionId);
    setSelectedModelId(foundModelId);
    setSelectedColorId(foundColorId);
    setWidthId(texture.widthId);
  };

  const handleCancel = () => {
    setWidthId('');
    setSelectedCollectionId('');
    setSelectedModelId('');
    setSelectedColorId('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this texture configuration? All uploaded maps will be lost.')) return;
    try {
      await deleteTexture.mutateAsync(id);
      showStatus('Texture configuration deleted successfully!');
      handleCancel();
    } catch (err: unknown) {
      showStatus(String(err), 'error');
    }
  };

  const handleMapUpload = async (textureId: string, file: File, type: 'gold' | 'silver' | 'engrave' | 'normalBase' | 'normalFinishing') => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      if (type === 'gold') {
        await uploadGold.mutateAsync({ id: textureId, formData });
        showStatus('Gold Ambient Occlusion map uploaded successfully!');
      } else if (type === 'silver') {
        await uploadSilver.mutateAsync({ id: textureId, formData });
        showStatus('Silver Ambient Occlusion map uploaded successfully!');
      } else if (type === 'engrave') {
        await uploadEngrave.mutateAsync({ id: textureId, formData });
        showStatus('Engrave Ambient Occlusion map uploaded successfully!');
      } else if (type === 'normalBase') {
        await uploadNormalBase.mutateAsync({ id: textureId, formData });
        showStatus('Normal Base map uploaded successfully!');
      } else {
        await uploadNormalFinishing.mutateAsync({ id: textureId, formData });
        showStatus('Normal Finishing map uploaded successfully!');
      }
    } catch (err: unknown) {
      showStatus(`Texture upload failed: ${String(err)}`, 'error');
    }
  };

  // Flatten options for selection and listing
  const texturesList: {
    texture: Texture;
    widthValue: string;
    colorName: string;
    colorId: string;
    modelName: string;
    modelId: string;
    collectionName: string;
    collectionId: string;
  }[] = [];

  collections.forEach((collection) => {
    if (collection.models && Array.isArray(collection.models)) {
      collection.models.forEach((model) => {
        if (model.colors && Array.isArray(model.colors)) {
          model.colors.forEach((color) => {
            if (color.widths && Array.isArray(color.widths)) {
              color.widths.forEach((width) => {
                if (width.texture) {
                  texturesList.push({
                    texture: width.texture,
                    widthValue: width.value,
                    colorName: color.name,
                    colorId: color.id || '',
                    modelName: model.name,
                    modelId: model.id || '',
                    collectionName: collection.name,
                    collectionId: collection.id || '',
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  // Derived options based on granular selection for filters
  const filterCollection = collections.find((c) => c.id === filterCollectionId);
  const filterModelOptions = filterCollection?.models || [];
  const filterModel = filterModelOptions.find((m) => m.id === filterModelId);
  const filterColorOptions = filterModel?.colors || [];

  // Derived options for Form Panel (Link Texture Container)
  const formCollection = collections.find((c) => c.id === selectedCollectionId);
  const formModelOptions = formCollection?.models || [];
  const formModel = formModelOptions.find((m) => m.id === selectedModelId);
  const formColorOptions = formModel?.colors || [];
  const formColor = formColorOptions.find((c) => c.id === selectedColorId);
  const formWidthOptions = formColor?.widths || [];

  // Show all width options
  const availableFormWidths = formWidthOptions;

  // Find existing texture configuration for selected width
  const selectedWidthObj = formWidthOptions.find(w => w.id === widthId);
  const currentTexture = selectedWidthObj?.texture;

  // Filter textures
  const filteredTextures = texturesList.filter((item) => {
    const matchesCollection = filterCollectionId ? item.collectionId === filterCollectionId : true;
    const matchesModel = filterModelId ? item.modelId === filterModelId : true;
    const matchesColor = filterColorId ? item.colorId === filterColorId : true;
    return matchesCollection && matchesModel && matchesColor;
  });

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Ambient Occlusion Textures</h1>
        <p className="dashboard-subtitle">Upload and configure Ambient Occlusion (AO) texture maps for metallic shader rendering.</p>
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
          <h2 className="card-title">Configure Texture Maps</h2>
          <div>
            <div className="form-group">
              <label className="form-label">Collection</label>
              <select
                className="form-select"
                value={selectedCollectionId}
                onChange={(e) => {
                  setSelectedCollectionId(e.target.value);
                  setSelectedModelId('');
                  setSelectedColorId('');
                  setWidthId('');
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
                  setSelectedColorId('');
                  setWidthId('');
                }}
                disabled={!selectedCollectionId}
                required
              >
                <option value="">-- Select Model --</option>
                {formModelOptions.map((model) => (
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
                value={selectedColorId}
                onChange={(e) => {
                  setSelectedColorId(e.target.value);
                  setWidthId('');
                }}
                disabled={!selectedModelId}
                required
              >
                <option value="">-- Select Color --</option>
                {formColorOptions.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name} ({color.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Width Option</label>
              <select
                className="form-select"
                value={widthId}
                onChange={(e) => setWidthId(e.target.value)}
                disabled={!selectedColorId}
                required
              >
                <option value="">-- Select Width Option --</option>
                {availableFormWidths.map((width) => (
                  <option key={width.id} value={width.id}>
                    Width {width.value}mm {width.texture ? '(Already configured)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {widthId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Ambient Occlusion & Normal Maps</h3>
                
                {/* Gold AO */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: currentTexture?.aoGold ? '#10b981' : 'var(--text-secondary)' }}>
                    {currentTexture?.aoGold ? '✓ Gold AO Map Loaded' : '✗ Gold AO Map Missing'}
                  </span>
                  <div className="file-upload-zone" style={{ margin: 0, padding: '0.2rem 0.5rem', minHeight: 'auto', display: 'inline-block' }}>
                    <span style={{ fontSize: '0.75rem' }}>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="file-upload-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadClick(file, 'gold');
                      }}
                    />
                  </div>
                </div>

                {/* Silver AO */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: currentTexture?.aoSilver ? '#10b981' : 'var(--text-secondary)' }}>
                    {currentTexture?.aoSilver ? '✓ Silver AO Map Loaded' : '✗ Silver AO Map Missing'}
                  </span>
                  <div className="file-upload-zone" style={{ margin: 0, padding: '0.2rem 0.5rem', minHeight: 'auto', display: 'inline-block' }}>
                    <span style={{ fontSize: '0.75rem' }}>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="file-upload-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadClick(file, 'silver');
                      }}
                    />
                  </div>
                </div>

                {/* Engrave AO */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: currentTexture?.aoEngrave ? '#10b981' : 'var(--text-secondary)' }}>
                    {currentTexture?.aoEngrave ? '✓ Engrave AO Map Loaded' : '✗ Engrave AO Map Missing'}
                  </span>
                  <div className="file-upload-zone" style={{ margin: 0, padding: '0.2rem 0.5rem', minHeight: 'auto', display: 'inline-block' }}>
                    <span style={{ fontSize: '0.75rem' }}>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="file-upload-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadClick(file, 'engrave');
                      }}
                    />
                  </div>
                </div>

                {/* Normal Base */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: currentTexture?.normalBase ? '#10b981' : 'var(--text-secondary)' }}>
                    {currentTexture?.normalBase ? '✓ Normal Base Map Loaded' : '✗ Normal Base Map Missing'}
                  </span>
                  <div className="file-upload-zone" style={{ margin: 0, padding: '0.2rem 0.5rem', minHeight: 'auto', display: 'inline-block' }}>
                    <span style={{ fontSize: '0.75rem' }}>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="file-upload-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadClick(file, 'normalBase');
                      }}
                    />
                  </div>
                </div>

                {/* Normal Finishing */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: currentTexture?.normalFinishing ? '#10b981' : 'var(--text-secondary)' }}>
                    {currentTexture?.normalFinishing ? '✓ Normal Finishing Map Loaded' : '✗ Normal Finishing Map Missing'}
                  </span>
                  <div className="file-upload-zone" style={{ margin: 0, padding: '0.2rem 0.5rem', minHeight: 'auto', display: 'inline-block' }}>
                    <span style={{ fontSize: '0.75rem' }}>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="file-upload-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadClick(file, 'normalFinishing');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List Panel */}
        <div className="card-panel">
          {/* Filter Controls */}
          <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Filter Textures</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
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

              <div className="form-group" style={{ margin: 0 }}>
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
                  {filterModelOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Color</label>
                <select
                  className="form-select"
                  value={filterColorId}
                  onChange={(e) => setFilterColorId(e.target.value)}
                  disabled={!filterModelId}
                >
                  <option value="">-- All Colors --</option>
                  {filterColorOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <h2 className="card-title">Configured Ambient Occlusion Maps</h2>
          {filteredTextures.length === 0 ? (
            <div className="empty-state">
              {texturesList.length === 0
                ? 'No texture configurations found. Link one to get started.'
                : 'No texture configurations match the selected filters.'}
            </div>
          ) : (
            <div className="list-container">
              {filteredTextures.map(({ texture, widthValue, colorName, modelName }) => (
                <div key={texture.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="list-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', fontSize: '1.5rem' }}>
                        🗺️
                      </div>
                      <div>
                        <h3 className="list-item-title">Texture Maps Config</h3>
                        <p className="list-item-subtitle" style={{ fontSize: '0.75rem' }}>
                          Model: {modelName} • Width: <strong style={{ color: '#10b981' }}>{widthValue}mm</strong> ({colorName})
                        </p>
                      </div>
                    </div>

                    <div className="list-item-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleEdit(texture)}
                      >
                        Edit
                      </button>
                      {texture.id && (
                        <button
                          className="btn btn-danger-outline"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          onClick={() => handleDelete(texture.id!)}
                          disabled={deleteTexture.isPending}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Upload and Status grids for texture maps */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '8px' }}>
                    {/* Gold AO */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', color: texture.aoGold ? '#10b981' : 'var(--text-secondary)' }}>
                        {texture.aoGold ? '✓ Gold AO Map Loaded' : '✗ Gold AO Map Missing'}
                      </span>
                      <div className="file-upload-zone" style={{ margin: 0, padding: '0.2rem 0.5rem', minHeight: 'auto', display: 'inline-block' }}>
                        <span style={{ fontSize: '0.75rem' }}>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="file-upload-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && texture.id) handleMapUpload(texture.id, file, 'gold');
                          }}
                        />
                      </div>
                    </div>

                    {/* Silver AO */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', color: texture.aoSilver ? '#10b981' : 'var(--text-secondary)' }}>
                        {texture.aoSilver ? '✓ Silver AO Map Loaded' : '✗ Silver AO Map Missing'}
                      </span>
                      <div className="file-upload-zone" style={{ margin: 0, padding: '0.2rem 0.5rem', minHeight: 'auto', display: 'inline-block' }}>
                        <span style={{ fontSize: '0.75rem' }}>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="file-upload-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && texture.id) handleMapUpload(texture.id, file, 'silver');
                          }}
                        />
                      </div>
                    </div>

                    {/* Engrave AO */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', color: texture.aoEngrave ? '#10b981' : 'var(--text-secondary)' }}>
                        {texture.aoEngrave ? '✓ Engrave AO Map Loaded' : '✗ Engrave AO Map Missing'}
                      </span>
                      <div className="file-upload-zone" style={{ margin: 0, padding: '0.2rem 0.5rem', minHeight: 'auto', display: 'inline-block' }}>
                        <span style={{ fontSize: '0.75rem' }}>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="file-upload-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && texture.id) handleMapUpload(texture.id, file, 'engrave');
                          }}
                        />
                      </div>
                    </div>

                    {/* Normal Base */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', color: texture.normalBase ? '#10b981' : 'var(--text-secondary)' }}>
                        {texture.normalBase ? '✓ Normal Base Map Loaded' : '✗ Normal Base Map Missing'}
                      </span>
                      <div className="file-upload-zone" style={{ margin: 0, padding: '0.2rem 0.5rem', minHeight: 'auto', display: 'inline-block' }}>
                        <span style={{ fontSize: '0.75rem' }}>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="file-upload-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && texture.id) handleMapUpload(texture.id, file, 'normalBase');
                          }}
                        />
                      </div>
                    </div>

                    {/* Normal Finishing */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', color: texture.normalFinishing ? '#10b981' : 'var(--text-secondary)' }}>
                        {texture.normalFinishing ? '✓ Normal Finishing Map Loaded' : '✗ Normal Finishing Map Missing'}
                      </span>
                      <div className="file-upload-zone" style={{ margin: 0, padding: '0.2rem 0.5rem', minHeight: 'auto', display: 'inline-block' }}>
                        <span style={{ fontSize: '0.75rem' }}>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="file-upload-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && texture.id) handleMapUpload(texture.id, file, 'normalFinishing');
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTextures;
