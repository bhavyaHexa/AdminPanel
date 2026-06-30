import React, { useState } from 'react';
import useGetAllCollections from '../hooks/useGetAllCollections';
import { useUploadAsset3DGlb } from '../hooks/useUploadAsset3DGlb';
import Loader from './Loader';
import usePostAssests from '../hooks/usePostAssests';
import { useDeleteAsset3D } from '../hooks/useDeleteAsset3D';
import usePostTextures from '../hooks/usePostTextures';
import { useUpdateTexture } from '../hooks/useUpdateTexture';
import type { Width, Asset3D } from '../types';

const AddAssets: React.FC = () => {
  const { data: collections = [] } = useGetAllCollections();
  
  const uploadGlb = useUploadAsset3DGlb();
  const createAsset = usePostAssests();
  const deleteAsset = useDeleteAsset3D();
  const createTexture = usePostTextures();
  const updateTexture = useUpdateTexture();

  // Form State
  const [widthId, setWidthId] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [mode, setMode] = useState<'upload' | 'existing'>('upload');
  const [sourceModelName, setSourceModelName] = useState('');
  const [selectedAssetUrl, setSelectedAssetUrl] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedColorId, setSelectedColorId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [filterCollectionId, setFilterCollectionId] = useState('');
  const [filterModelId, setFilterModelId] = useState('');
  const [filterColorId, setFilterColorId] = useState('');

  // Options for dependent dropdowns
  const collectionOptions = collections;
  const selectedCollection = collections.find(c => c.id === selectedCollectionId);
  const modelOptions = selectedCollection?.models || [];
  const selectedModel = modelOptions.find(m => m.id === selectedModelId);
  const colorOptions = selectedModel?.colors || [];
  const selectedColor = colorOptions.find(c => c.id === selectedColorId);
  const widthOptions = selectedColor?.widths || [];

  const filterSelectedCollection = collections.find(c => c.id === filterCollectionId);
  const filterModelOptions = filterSelectedCollection?.models || [];
  const filterSelectedModel = filterModelOptions.find(m => m.id === filterModelId);
  const filterColorOptions = filterSelectedModel?.colors || [];

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Flatten options for selection and listing
  const widthsList: {
    width: Width;
    colorName: string;
    modelName: string;
    collectionName: string;
    collectionId: string;
    modelId: string;
    colorId: string;
  }[] = [];
  const assetsList: {
    asset: Asset3D;
    widthValue: string;
    colorName: string;
    modelName: string;
    widthId: string;
    collectionId: string;
    modelId: string;
    colorId: string;
  }[] = [];

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
                  collectionId: collection.id || '',
                  modelId: model.id || '',
                  colorId: color.id || '',
                });
                if (width.asset3D) {
                  assetsList.push({
                    asset: width.asset3D,
                    widthValue: width.value,
                    colorName: color.name,
                    modelName: model.name,
                    widthId: width.id || '',
                    collectionId: collection.id || '',
                    modelId: model.id || '',
                    colorId: color.id || '',
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  const filteredAssets = assetsList.filter((assetItem) =>
    (!filterCollectionId || assetItem.collectionId === filterCollectionId) &&
    (!filterModelId || assetItem.modelId === filterModelId) &&
    (!filterColorId || assetItem.colorId === filterColorId)
  );

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

    // Pre-populate dependent dropdown states
    let foundCollectionId = '';
    let foundModelId = '';
    let foundColorId = '';
    for (const col of collections) {
      for (const mod of col.models || []) {
        for (const colr of mod.colors || []) {
          if (colr.widths?.some(w => w.id === targetWidthId)) {
            foundCollectionId = col.id || '';
            foundModelId = mod.id || '';
            foundColorId = colr.id || '';
            break;
          }
        }
      }
    }
    setSelectedCollectionId(foundCollectionId);
    setSelectedModelId(foundModelId);
    setSelectedColorId(foundColorId);
    setSelectedFile(null);
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
      if (!selectedFile) {
        showStatus('Please select a .glb file to upload', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
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
        setSelectedCollectionId('');
        setSelectedModelId('');
        setSelectedColorId('');
        setVersion('1.0.0');
        setSelectedFile(null);
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

        // Copy textures from source width if they exist
        if (details) {
          const modelAssets = assetsList.filter(a => a.modelName === details.modelName);
          if (modelAssets.length > 0) {
            const sourceWidthId = modelAssets[0].widthId;
            const sourceWidthDetails = widthsList.find(({ width }) => width.id === sourceWidthId);
            const sourceWidthTexture = sourceWidthDetails?.width.texture;
            
            if (sourceWidthTexture) {
              const targetWidthTexture = details.width.texture;
              const texturePayload = {
                aoGold: sourceWidthTexture.aoGold || undefined,
                aoSilver: sourceWidthTexture.aoSilver || undefined,
                aoEngrave: sourceWidthTexture.aoEngrave || undefined,
                normalBase: sourceWidthTexture.normalBase || undefined,
                normalFinishing: sourceWidthTexture.normalFinishing || undefined,
                noDiamondBase: sourceWidthTexture.noDiamondBase || undefined,
                noDiamondFinishing: sourceWidthTexture.noDiamondFinishing || undefined,
              };

              if (targetWidthTexture && targetWidthTexture.id) {
                await updateTexture.mutateAsync({
                  id: targetWidthTexture.id,
                  data: texturePayload
                });
              } else {
                await createTexture.mutateAsync({
                  widthId,
                  ...texturePayload
                });
              }
            }
          }
        }

        showStatus('GLB asset and textures linked successfully!');
        // Reset form
        setWidthId('');
        setSelectedCollectionId('');
        setSelectedModelId('');
        setSelectedColorId('');
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

  const isAnyActionPending = 
    uploadGlb.isPending || 
    createAsset.isPending || 
    deleteAsset.isPending ||
    createTexture.isPending ||
    updateTexture.isPending;

  return (
    <div>
      {isAnyActionPending && (
        <Loader 
          message={
            deleteAsset.isPending
              ? "Deleting 3D asset..."
              : uploadGlb.isPending
              ? "Uploading GLB model file (this may take a few moments)..."
              : "Saving asset configuration..."
          }
        />
      )}
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
                {collectionOptions.map((c) => (
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
                {modelOptions.map((m) => (
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
                value={selectedColorId}
                onChange={(e) => {
                  setSelectedColorId(e.target.value);
                  setWidthId('');
                }}
                disabled={!selectedModelId}
                required
              >
                <option value="">-- Select Color --</option>
                {colorOptions.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Width Option</label>
              <select
                className="form-select"
                value={widthId}
                onChange={(e) => handleWidthChange(e.target.value)}
                disabled={!selectedColorId}
                required
              >
                <option value="">-- Select Width --</option>
                {widthOptions.map((w) => (
                  <option key={w.id} value={w.id || ''}>
                    {w.value}mm
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

            {mode === 'upload' ? (
              <div className="form-group">
                <label className="form-label">3D Geometry (.glb)</label>
                {selectedFile ? (
                  <div
                    style={{
                      border: '2px dashed var(--primary)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      textAlign: 'center',
                      background: 'rgba(16, 185, 129, 0.02)',
                      marginTop: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ fontSize: '2rem' }}>📦</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          color: 'var(--text-primary)',
                          wordBreak: 'break-all',
                          display: 'block',
                        }}
                      >
                        {selectedFile.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger-outline"
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.85rem',
                        borderRadius: '8px',
                        marginTop: '0.5rem',
                      }}
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="file-upload-zone">
                    <span className="file-upload-text">Drag & drop or click to select GLB file</span>
                    <p className="file-upload-subtext">Supports .glb format only</p>
                    <input
                      id="glb-file-input"
                      type="file"
                      accept=".glb"
                      className="file-upload-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                      }}
                      required={mode === 'upload'}
                    />
                  </div>
                )}
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
          <div className="filter-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filter by Collection</label>
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
                {collectionOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filter by Model</label>
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

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filter by Color</label>
              <select
                className="form-select"
                value={filterColorId}
                onChange={(e) => setFilterColorId(e.target.value)}
                disabled={!filterModelId}
              >
                <option value="">-- All Colors --</option>
                {filterColorOptions.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="empty-state">No matching 3D assets found for selected filter.</div>
          ) : (
            <div className="list-container">
              {filteredAssets.map(({ asset, widthValue, colorName, modelName, widthId: assetWidthId }) => (
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
