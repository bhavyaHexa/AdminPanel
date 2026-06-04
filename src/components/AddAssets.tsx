import React, { useState } from 'react';
import useGetAllModels from '../hooks/useGetAllModels';
import useGetAllCollections from '../hooks/useGetAllCollections';
import usePostAssests from '../hooks/usePostAssests';
import { useUploadAsset3DGlb } from '../hooks/useUploadAsset3DGlb';
import type { Width, Asset3D } from '../types';

const AddAssets: React.FC = () => {
  const { data: models = [] } = useGetAllModels();
  const { data: collections = [] } = useGetAllCollections();
  
  const createAsset = usePostAssests();
  const uploadGlb = useUploadAsset3DGlb();

  // Form State
  const [widthId, setWidthId] = useState('');
  const [version, setVersion] = useState('1.0.0');

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById('glb-file-input') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!widthId) {
      showStatus('Please select a Width Option first', 'error');
      return;
    }
    if (!file) {
      showStatus('Please select a .glb file to upload', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', version);

    try {
      await uploadGlb.mutateAsync({ widthId, formData });
      showStatus('GLB asset uploaded and linked successfully!');
      // Reset form
      setWidthId('');
      setVersion('1.0.0');
      if (fileInput) fileInput.value = '';
    } catch (err: unknown) {
      showStatus(`GLB Upload failed: ${String(err)}`, 'error');
    }
  };

  // Flatten options for selection and listing
  const widthsList: { width: Width; colorName: string; modelName: string; collectionName: string }[] = [];
  const assetsList: { asset: Asset3D; widthValue: string; colorName: string; modelName: string }[] = [];

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
          <h2 className="card-title">Upload GLB Asset</h2>
          <form onSubmit={handleFileUpload}>
            <div className="form-group">
              <label className="form-label">Target Width Option</label>
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
                  required
                />
              </div>
            </div>

            <div className="btn-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploadGlb.isPending}
              >
                {uploadGlb.isPending ? 'Uploading...' : 'Upload & Link GLB'}
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
              {assetsList.map(({ asset, widthValue, colorName, modelName }) => (
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
