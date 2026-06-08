import React, { useState } from 'react';
import useGetAllCollections from '../hooks/useGetAllCollections';
import { useUploadAsset3DGlb } from '../hooks/useUploadAsset3DGlb';
import usePostAssests from '../hooks/usePostAssests';
import { useDeleteAsset3D } from '../hooks/useDeleteAsset3D';
import type { Width, Asset3D } from '../types';

const AddAssets: React.FC = () => {
  const { data: collections = [] } = useGetAllCollections();
  
  const uploadGlb = useUploadAsset3DGlb();
  const createAsset = usePostAssests();
  const deleteAsset = useDeleteAsset3D();

  // Form State
  const [widthId, setWidthId] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [mode, setMode] = useState<'upload' | 'existing'>('upload');
  const [sourceModelName, setSourceModelName] = useState('');
  const [selectedAssetUrl, setSelectedAssetUrl] = useState('');

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Flatten options for selection and listing
  const widthsList: { width: Width; colorName: string; modelName: string; collectionName: string }[] = [];
  const assetsList: { asset: Asset3D; widthValue: string; colorName: string; modelName: string; widthId: string }[] = [];

  collections.forEach((collection) => {
    if (collection.models && Array.isArray(collection.models)) {
      collection.models.forEach((model) => {
        if (model.colors && Array.isArray(model.colors)) {
          model.colors.forEach((color) => {
            if (color.widths && Array.isArray(color.widths)) {
              color.widths.forEach((width) => {
                widthsList.push({
                  width,
                  colorName: color.name,
                  modelName: model.name,
                  collectionName: collection.name,
                });
                if (width.asset3D) {
                  assetsList.push({
                    asset: width.asset3D,
                    widthValue: width.value,
                    colorName: color.name,
                    modelName: model.name,
                    widthId: width.id || '',
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  const modelsWithAssets = Array.from(new Set(assetsList.map((a) => a.modelName)));

  const handleWidthChange = (val: string) => {
    setWidthId(val);
    const details = widthsList.find(({ width }) => width.id === val);
    if (details) {
      if (modelsWithAssets.includes(details.modelName)) {
        setSourceModelName(details.modelName);
        const modelAssets = assetsList.filter(a => a.modelName === details.modelName);
        if (modelAssets.length > 0) {
          setSelectedAssetUrl(modelAssets[0].asset.model_url);
          if (modelAssets[0].asset.version) {
            setVersion(modelAssets[0].asset.version);
          }
        }
      } else {
        setSourceModelName('');
        setSelectedAssetUrl('');
      }
    } else {
      setSourceModelName('');
      setSelectedAssetUrl('');
    }
  };

  const handleEditAsset = (targetWidthId: string, currentUrl: string, currentVersion: string) => {
    setWidthId(targetWidthId);
    setMode('existing');
    setSelectedAssetUrl(currentUrl);
    setVersion(currentVersion || '1.0.0');
    const details = widthsList.find(({ width }) => width.id === targetWidthId);
    if (details) {
      setSourceModelName(details.modelName);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this 3D asset?')) return;
    try {
      await deleteAsset.mutateAsync(id);
      showStatus('GLB asset deleted successfully!');
    } catch (err: unknown) {
      showStatus(`Failed to delete asset: ${String(err)}`, 'error');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!widthId) {
      showStatus('Please select a Target Width Option first', 'error');
      return;
    }

    if (mode === 'upload') {
      const fileInput = document.getElementById('glb-file-input') as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (!file) {
        showStatus('Please select a .glb file to upload', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('version', version);

      try {
        // Find if this target width option already has an asset
        const details = widthsList.find(({ width }) => width.id === widthId);
        const existingAssetId = details?.width.asset3D?.id;

        if (existingAssetId) {
          await deleteAsset.mutateAsync(existingAssetId);
        }

        await uploadGlb.mutateAsync({ widthId, formData });
        showStatus('GLB asset uploaded and linked successfully!');
        // Reset form
        setWidthId('');
        setVersion('1.0.0');
        if (fileInput) fileInput.value = '';
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || String(err);
        showStatus(`GLB Upload failed: ${errMsg}`, 'error');
        console.error('GLB upload error details:', err?.response?.data || err);
      }
    } else {
      if (!selectedAssetUrl) {
        showStatus('Please select an existing asset to copy the URL from', 'error');
        return;
      }

      try {
        // Find if this target width option already has an asset
        const details = widthsList.find(({ width }) => width.id === widthId);
        const existingAssetId = details?.width.asset3D?.id;

        if (existingAssetId) {
          await deleteAsset.mutateAsync(existingAssetId);
        }

        await createAsset.mutateAsync({
          widthId,
          model_url: selectedAssetUrl,
          version: version,
        });
        showStatus('GLB asset URL linked successfully!');
        // Reset form
        setWidthId('');
        setVersion('1.0.0');
        setSelectedAssetUrl('');
        setSourceModelName('');
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || String(err);
        showStatus(`GLB linking failed: ${errMsg}`, 'error');
        console.error('GLB linking error details:', err?.response?.data || err);
      }
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">3D Assets Management</h1>
        <p className="dashboard-subtitle">Upload 3D mesh GLB geometries for customizable widths.</p>
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
        {/* Upload Panel */}
        <div className="card-panel">
          <h2 className="card-title">{mode === 'upload' ? 'Upload GLB Asset' : 'Link Existing GLB'}</h2>
          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label className="form-label">Target Width Option</label>
              <select
                className="form-select"
                value={widthId}
                onChange={(e) => handleWidthChange(e.target.value)}
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

            <div className="form-group">
              <label className="form-label">Asset Source</label>
              <div style={{
                display: 'flex',
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                marginBottom: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => setMode('upload')}
                  style={{
                    flex: 1,
                    background: mode === 'upload' ? 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)' : 'transparent',
                    color: mode === 'upload' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Upload New GLB
                </button>
                <button
                  type="button"
                  onClick={() => setMode('existing')}
                  style={{
                    flex: 1,
                    background: mode === 'existing' ? 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)' : 'transparent',
                    color: mode === 'existing' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Use Existing URL
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Asset Version</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 1.0.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
              />
            </div>

            {mode === 'upload' ? (
              <div className="form-group">
                <label className="form-label">3D Geometry (.glb)</label>
                <div className="file-upload-zone">
                  <span className="file-upload-text">Drag & drop or click to select GLB file</span>
                  <p className="file-upload-subtext">Supports .glb format only</p>
                  <input
                    id="glb-file-input"
                    type="file"
                    accept=".glb"
                    className="file-upload-input"
                    required={mode === 'upload'}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Source Model (Copy from)</label>
                  <select
                    className="form-select"
                    value={sourceModelName}
                    onChange={(e) => {
                      const newModelName = e.target.value;
                      setSourceModelName(newModelName);
                      const modelAssets = assetsList.filter(a => a.modelName === newModelName);
                      if (modelAssets.length > 0) {
                        setSelectedAssetUrl(modelAssets[0].asset.model_url);
                        if (modelAssets[0].asset.version) {
                          setVersion(modelAssets[0].asset.version);
                        }
                      } else {
                        setSelectedAssetUrl('');
                      }
                    }}
                    required={mode === 'existing'}
                  >
                    <option value="">-- Select Model with Existing Assets --</option>
                    {modelsWithAssets.map((mName) => (
                      <option key={mName} value={mName}>
                        {mName}
                      </option>
                    ))}
                  </select>
                </div>

                {sourceModelName && (
                  <div className="form-group">
                    <label className="form-label">Source Asset to Copy URL from</label>
                    <select
                      className="form-select"
                      value={selectedAssetUrl}
                      onChange={(e) => {
                        setSelectedAssetUrl(e.target.value);
                        const matchedAsset = assetsList.find(a => a.asset.model_url === e.target.value);
                        if (matchedAsset && matchedAsset.asset.version) {
                          setVersion(matchedAsset.asset.version);
                        }
                      }}
                      required={mode === 'existing'}
                    >
                      <option value="">-- Select Asset --</option>
                      {assetsList
                        .filter((a) => a.modelName === sourceModelName)
                        .map((a) => (
                          <option key={a.asset.id} value={a.asset.model_url}>
                            {a.colorName} • {a.widthValue}mm ({a.asset.model_url.split('/').pop()})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Model URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedAssetUrl}
                    onChange={(e) => setSelectedAssetUrl(e.target.value)}
                    placeholder="https://.../model.glb"
                    required={mode === 'existing'}
                  />
                </div>
              </>
            )}

            <div className="btn-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mode === 'upload' ? uploadGlb.isPending : createAsset.isPending}
              >
                {mode === 'upload'
                  ? (uploadGlb.isPending ? 'Uploading...' : 'Upload & Link GLB')
                  : (createAsset.isPending ? 'Linking...' : 'Link Existing GLB')}
              </button>
            </div>
          </form>
        </div>

        {/* List Panel */}
        <div className="card-panel">
          <h2 className="card-title">Configured 3D Meshes</h2>
          {assetsList.length === 0 ? (
            <div className="empty-state">No 3D assets uploaded yet. Upload a GLB for your widths.</div>
          ) : (
            <div className="list-container">
              {assetsList.map(({ asset, widthValue, colorName, modelName, widthId: assetWidthId }) => (
                <div key={asset.id} className="list-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div className="list-item-img" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', fontSize: '1.5rem' }}>
                      📦
                    </div>
                    <div>
                      <h3 className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Version: {asset.version}
                        <span className="badge-tag" style={{ background: 'rgba(59,130,246,0.1)' }}>{widthValue}mm Width</span>
                      </h3>
                      <p className="list-item-subtitle" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                        GLB: <a href={asset.model_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)' }}>{asset.model_url.split('/').pop()}</a>
                      </p>
                      <p className="list-item-subtitle" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Color: {colorName} • Model: {modelName}
                      </p>
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{
                        padding: "0.4rem 0.8rem",
                        fontSize: "0.85rem",
                      }}
                      onClick={() => handleEditAsset(assetWidthId, asset.model_url, asset.version)}
                    >
                      Edit
                    </button>
                    {asset.id && (
                      <button
                        type="button"
                        className="btn btn-danger-outline"
                        style={{
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.85rem",
                        }}
                        onClick={() => handleDeleteAsset(asset.id!)}
                        disabled={deleteAsset.isPending}
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
  );
};

export default AddAssets;
