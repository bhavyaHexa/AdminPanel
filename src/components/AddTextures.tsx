import React, { useState } from 'react';
import useGetAllCollections from '../hooks/useGetAllCollections';
import usePostTextures from '../hooks/usePostTextures';
import { useUploadTextureAoGold } from '../hooks/useUploadTextureAoGold';
import { useUploadTextureAoSilver } from '../hooks/useUploadTextureAoSilver';
import { useUploadTextureAoEngrave } from '../hooks/useUploadTextureAoEngrave';
import type { Width, Texture } from '../types';

const AddTextures: React.FC = () => {
  const { data: collections = [] } = useGetAllCollections();

  const createTexture = usePostTextures();
  const uploadGold = useUploadTextureAoGold();
  const uploadSilver = useUploadTextureAoSilver();
  const uploadEngrave = useUploadTextureAoEngrave();

  // Form State
  const [widthId, setWidthId] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!widthId) {
      showStatus('Please select a Width Option', 'error');
      return;
    }

    try {
      await createTexture.mutateAsync({ widthId });
      showStatus('Texture container created successfully! You can now upload maps.');
      setWidthId('');
    } catch (err: unknown) {
      showStatus(String(err), 'error');
    }
  };

  const handleMapUpload = async (textureId: string, file: File, type: 'gold' | 'silver' | 'engrave') => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      if (type === 'gold') {
        await uploadGold.mutateAsync({ id: textureId, formData });
        showStatus('Gold Ambient Occlusion map uploaded successfully!');
      } else if (type === 'silver') {
        await uploadSilver.mutateAsync({ id: textureId, formData });
        showStatus('Silver Ambient Occlusion map uploaded successfully!');
      } else {
        await uploadEngrave.mutateAsync({ id: textureId, formData });
        showStatus('Engrave Ambient Occlusion map uploaded successfully!');
      }
    } catch (err: unknown) {
      showStatus(`Texture upload failed: ${String(err)}`, 'error');
    }
  };

  // Flatten options for selection and listing
  const widthsList: { width: Width; colorName: string; modelName: string; collectionName: string }[] = [];
  const texturesList: { texture: Texture; widthValue: string; colorName: string; modelName: string }[] = [];

  collections.forEach((collection) => {
    if (collection.models && Array.isArray(collection.models)) {
      collection.models.forEach((model) => {
        if (model.colors && Array.isArray(model.colors)) {
          model.colors.forEach((color) => {
            if (color.widths && Array.isArray(color.widths)) {
              color.widths.forEach((width) => {
                // Only suggest widths that do NOT already have textures configured
                if (!width.texture) {
                  widthsList.push({ width, colorName: color.name, modelName: model.name, collectionName: collection.name });
                }
                if (width.texture) {
                  texturesList.push({
                    texture: width.texture,
                    widthValue: width.value,
                    colorName: color.name,
                    modelName: model.name,
                  });
                }
              });
            }
          });
        }
      });
    }
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
          <h2 className="card-title">Link Texture Container</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Select Width (No textures yet)</label>
              <select
                className="form-select"
                value={widthId}
                onChange={(e) => setWidthId(e.target.value)}
                required
              >
                <option value="">-- Select Width Option --</option>
                {widthsList.map(({ width, colorName, modelName, collectionName }) => (
                  <option key={width.id} value={width.id}>
                    Width {width.value}mm ({colorName} • Model {modelName} • {collectionName})
                  </option>
                ))}
              </select>
            </div>

            <div className="btn-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createTexture.isPending}
              >
                Create Texture Config
              </button>
            </div>
          </form>
        </div>

        {/* List Panel */}
        <div className="card-panel">
          <h2 className="card-title">Configured Ambient Occlusion Maps</h2>
          {texturesList.length === 0 ? (
            <div className="empty-state">No texture configurations found. Link one to get started.</div>
          ) : (
            <div className="list-container">
              {texturesList.map(({ texture, widthValue, colorName, modelName }) => (
                <div key={texture.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
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
