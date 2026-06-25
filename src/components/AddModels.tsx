import React, { useState } from "react";
import useGetAllCollections from "../hooks/useGetAllCollections";
import useGetAllModels from "../hooks/useGetAllModels";
import usePostModel from "../hooks/usePostModel";
import { useUpdateModel } from "../hooks/useUpdateModel";
import { useDeleteModel } from "../hooks/useDeleteModel";
import { useUploadModelImage } from "../hooks/useUploadModelImage";
import { useUploadModelPreview } from "../hooks/useUploadModelPreview";
import { useDeleteColor } from "../hooks/useDeleteColor";
import { useDeleteWidth } from "../hooks/useDeleteWidth";
import { useDeletePriceList } from "../hooks/useDeletePriceList";
import { useDeleteTexture } from "../hooks/useDeleteTexture";
import { useDeleteAsset3D } from "../hooks/useDeleteAsset3D";
import type { Model } from "../types";

const AddModels: React.FC = () => {
  const { data: collections = [] } = useGetAllCollections();
  const { data: models = [], isLoading, error } = useGetAllModels();

  const createModel = usePostModel();
  const updateModel = useUpdateModel();
  const deleteModel = useDeleteModel();
  const deleteColor = useDeleteColor();
  const deleteWidth = useDeleteWidth();
  const deletePriceList = useDeletePriceList();
  const deleteTexture = useDeleteTexture();
  const deleteAsset3D = useDeleteAsset3D();
  const uploadImage = useUploadModelImage();
  const uploadPreview = useUploadModelPreview();

  // Form State
  const [collectionId, setCollectionId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseMetalColor, setBaseMetalColor] = useState("Yellow Gold");
  const [finishingMetalColor, setFinishingMetalColor] = useState("Yellow Gold");
  const [engravingMeshColor, setEngravingMeshColor] = useState("Yellow Gold");
  const [isDiamonds, setIsDiamonds] = useState(false);

  // colorChange checkboxes state
  const [colorChangeBase, setColorChangeBase] = useState(true);
  const [colorChangeFinishing, setColorChangeFinishing] = useState(true);
  const [colorChangeEngraving, setColorChangeEngraving] = useState(true);

  // Image upload state for new/edit model
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [previewPreviewUrl, setPreviewPreviewUrl] = useState<string>("");

  // Filter for existing models by collection
  const [filterCollectionId, setFilterCollectionId] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showStatus = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !collectionId) {
      showStatus("Please specify Model Name and Collection", "error");
      return;
    }

    // Build colorChange array
    const colorChange: string[] = [];
    if (colorChangeBase) colorChange.push("base_metal_color");
    if (colorChangeFinishing) colorChange.push("finishing_metal_color");
    if (colorChangeEngraving) colorChange.push("engraving_mesh_color");

    const modelPayload: Partial<Model> = {
      name,
      description: description || null,
      base_metal_color: baseMetalColor,
      finishing_metal_color: finishingMetalColor,
      engraving_mesh_color: engravingMeshColor,
      colorChange,
      isDiamonds,
      collectionId,
    };

    const isDuplicate = models.some(
      (m) =>
        m.name.toLowerCase().trim() === name.toLowerCase().trim() &&
        m.collectionId === collectionId &&
        m.id !== editingId,
    );
    if (isDuplicate) {
      alert("Model already created");
      showStatus("Model already created", "error");
      return;
    }

    try {
      if (editingId) {
        await updateModel.mutateAsync({ id: editingId, data: modelPayload });
        // Upload image/preview if files selected
        if (imageFile) {
          const fd = new FormData();
          fd.append("file", imageFile);
          await uploadImage.mutateAsync({ id: editingId, formData: fd });
        }
        if (previewFile) {
          const fd = new FormData();
          fd.append("file", previewFile);
          await uploadPreview.mutateAsync({ id: editingId, formData: fd });
        }
        showStatus("Model updated successfully!");
      } else {
        const created = await createModel.mutateAsync(modelPayload);
        const newId = created.id;
        if (imageFile) {
          const fd = new FormData();
          fd.append("file", imageFile);
          await uploadImage.mutateAsync({ id: newId!, formData: fd });
        }
        if (previewFile) {
          const fd = new FormData();
          fd.append("file", previewFile);
          await uploadPreview.mutateAsync({ id: newId!, formData: fd });
        }
        showStatus("Model created successfully!");
      }
      handleCancel();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || String(err);
      showStatus(errMsg, "error");
    }
  };

  const handleEdit = (model: Model) => {
    if (!model.id) return;
    setEditingId(model.id);
    setName(model.name);
    setDescription(model.description || "");
    setBaseMetalColor(model.base_metal_color);
    setFinishingMetalColor(model.finishing_metal_color);
    setEngravingMeshColor(model.engraving_mesh_color);
    setIsDiamonds(model.isDiamonds);
    setCollectionId(model.collectionId);

    // Set checkboxes based on array
    setColorChangeBase(
      model.colorChange?.includes("base_metal_color") || false,
    );
    setColorChangeFinishing(
      model.colorChange?.includes("finishing_metal_color") || false,
    );
    setColorChangeEngraving(
      model.colorChange?.includes("engraving_mesh_color") || false,
    );
  };

  const handleDelete = async (model: Model) => {
    if (!model.id) return;
    if (
      !window.confirm(
        `Are you sure you want to delete model "${model.name}" and all its configurations (colors, widths, prices)?`,
      )
    )
      return;
    try {
      showStatus("Deleting model and all associated configurations... Please wait.", "success");

      // Find the fully populated model from the collections array
      let fullModel: Model | undefined;
      for (const c of collections) {
        if (c.models) {
          const found = c.models.find((m) => m.id === model.id);
          if (found) {
            fullModel = found;
            break;
          }
        }
      }

      const targetModel = fullModel || model;

      // 1. Delete associated configurations in cascade order (Prices, Textures, Widths, Colors, Model)
      if (targetModel.colors && targetModel.colors.length > 0) {
        for (const color of targetModel.colors) {
          if (color.widths && color.widths.length > 0) {
            for (const width of color.widths) {
              // Delete price lists
              if (width.priceLists && width.priceLists.length > 0) {
                for (const price of width.priceLists) {
                  if (price.id) {
                    await deletePriceList.mutateAsync(price.id);
                  }
                }
              }
              // Delete texture
              if (width.texture && width.texture.id) {
                await deleteTexture.mutateAsync(width.texture.id);
              }
              // Delete asset3d
              if (width.asset3D && width.asset3D.id) {
                await deleteAsset3D.mutateAsync(width.asset3D.id);
              }
              // Delete width
              if (width.id) {
                await deleteWidth.mutateAsync(width.id);
              }
            }
          }
          // Delete color
          if (color.id) {
            await deleteColor.mutateAsync(color.id);
          }
        }
      }

      // Finally delete the model itself
      await deleteModel.mutateAsync(targetModel.id!);
      showStatus("Model and all its configurations deleted successfully!");
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
    setName("");
    setDescription("");
    setBaseMetalColor("Yellow Gold");
    setFinishingMetalColor("Yellow Gold");
    setEngravingMeshColor("Yellow Gold");
    setIsDiamonds(false);
    setColorChangeBase(true);
    setColorChangeFinishing(true);
    setColorChangeEngraving(true);
    setImageFile(null);
    setPreviewFile(null);
    setImagePreviewUrl("");
    setPreviewPreviewUrl("");
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Models Management</h1>
        <p className="dashboard-subtitle">
          Create 3D design models, bind them to collections, and assign
          specifications.
        </p>
      </div>

      {statusMsg && (
        <div
          style={{
            padding: "1rem",
            borderRadius: "12px",
            marginBottom: "1.5rem",
            background:
              statusMsg.type === "success"
                ? "rgba(16, 185, 129, 0.15)"
                : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${statusMsg.type === "success" ? "#10b981" : "#ef4444"}`,
            color: statusMsg.type === "success" ? "#34d399" : "#f87171",
            fontSize: "0.9rem",
          }}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Form Panel */}
        <div className="card-panel">
          <h2 className="card-title">
            {editingId ? "Edit Model" : "Create Model"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Parent Collection</label>
              <select
                className="form-select"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                required
              >
                <option value="">-- Select Collection --</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Model Name / Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 174, 524, Silver Heart 664"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Base Metal Color</label>
                <select
                  className="form-select"
                  value={baseMetalColor}
                  onChange={(e) => setBaseMetalColor(e.target.value)}
                >
                  <option value="Yellow Gold">Yellow Gold</option>
                  <option value="White Gold">White Gold</option>
                  <option value="Rose Gold">Rose Gold</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Finishing Metal Color</label>
                <select
                  className="form-select"
                  value={finishingMetalColor}
                  onChange={(e) => setFinishingMetalColor(e.target.value)}
                >
                  <option value="Yellow Gold">Yellow Gold</option>
                  <option value="White Gold">White Gold</option>
                  <option value="Rose Gold">Rose Gold</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Engraving Mesh Color</label>
                <select
                  className="form-select"
                  value={engravingMeshColor}
                  onChange={(e) => setEngravingMeshColor(e.target.value)}
                >
                  <option value="Yellow Gold">Yellow Gold</option>
                  <option value="White Gold">White Gold</option>
                  <option value="Rose Gold">Rose Gold</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Color Configurable Fields</label>
              <div
                style={{ display: "flex", gap: "1.5rem", marginTop: "0.25rem" }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={colorChangeBase}
                    onChange={(e) => setColorChangeBase(e.target.checked)}
                  />
                  Base Metal
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={colorChangeFinishing}
                    onChange={(e) => setColorChangeFinishing(e.target.checked)}
                  />
                  Finishing Metal
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={colorChangeEngraving}
                    onChange={(e) => setColorChangeEngraving(e.target.checked)}
                  />
                  Engraving Mesh
                </label>
              </div>
            </div>
            <div className="form-row">
              {/* Model Image */}
              <div className="form-group">
                <label className="form-label">Model Image</label>
                <div className="file-upload-zone" style={{ minHeight: "80px" }}>
                  <span className="file-upload-text">Select model image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="file-upload-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
                {imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt="Model"
                    className="preview-img"
                    style={{ marginTop: "0.5rem", maxHeight: "120px" }}
                  />
                )}
              </div>

              {/* Model Preview */}
              <div className="form-group">
                <label className="form-label">Model Preview</label>
                <div className="file-upload-zone" style={{ minHeight: "80px" }}>
                  <span className="file-upload-text">Select preview image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="file-upload-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPreviewFile(file);
                        setPreviewPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
                {previewPreviewUrl && (
                  <img
                    src={previewPreviewUrl}
                    alt="Preview"
                    className="preview-img"
                    style={{ marginTop: "0.5rem", maxHeight: "120px" }}
                  />
                )}
              </div>
            </div>

            <div className="form-group">
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                <input
                  type="checkbox"
                  checked={isDiamonds}
                  onChange={(e) => setIsDiamonds(e.target.checked)}
                />
                Does this model contains Diamonds ?
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Brief model details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="btn-group">
              {editingId && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createModel.isPending || updateModel.isPending}
              >
                {editingId ? "Save Changes" : "Create Model"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column Wrapper containing Filter and List Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Collection Filter */}
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Filter by Collection</label>
            <select
              className="form-select"
              value={filterCollectionId}
              onChange={(e) => setFilterCollectionId(e.target.value)}
            >
              <option value="">All Collections</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* List Panel */}
          <div className="card-panel">
            <h2 className="card-title">Existing Models</h2>
            {(() => {
              const filteredModels = filterCollectionId
                ? models.filter((m) => m.collectionId === filterCollectionId)
                : models;

              if (isLoading) {
                return <div className="empty-state">Loading models...</div>;
              }

              if (error) {
                return (
                  <div className="empty-state" style={{ color: "#ef4444" }}>
                    Error loading models: {error.message}
                  </div>
                );
              }

              if (filteredModels.length === 0) {
                return <div className="empty-state">No models found. Create one.</div>;
              }

              return (
                <div className="list-container">
                  {filteredModels.map((model) => {
                    const parentCollectionName =
                      collections.find((c) => c.id === model.collectionId)?.name ||
                      "Unknown Collection";
                    return (
                      <div
                        key={model.id}
                        className="list-item"
                        style={{ flexDirection: "column", alignItems: "stretch" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                            }}
                          >
                            {model.image ? (
                              <img
                                src={model.image}
                                alt={model.name}
                                className="list-item-img"
                              />
                            ) : (
                              <div
                                className="list-item-img"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: "rgba(255,255,255,0.05)",
                                  fontSize: "1.5rem",
                                }}
                              >
                                📦
                              </div>
                            )}
                            <div>
                              <h3 className="list-item-title">{model.name}</h3>
                              <p
                                className="list-item-subtitle"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#10b981",
                                  fontWeight: 500,
                                }}
                              >
                                {parentCollectionName}
                              </p>
                              <p
                                className="list-item-subtitle"
                                style={{ fontSize: "0.75rem", marginTop: "2px" }}
                              >
                                {model.colors?.length || 0} Colors configured{" "}
                                {model.isDiamonds ? "• 💎 Diamonds" : ""}
                              </p>
                            </div>
                          </div>

                          <div className="list-item-actions">
                            <button
                              className="btn btn-ghost"
                              style={{
                                padding: "0.4rem 0.8rem",
                                fontSize: "0.85rem",
                              }}
                              onClick={() => handleEdit(model)}
                            >
                              Edit
                            </button>
                            {model.id && (
                              <button
                                className="btn btn-danger-outline"
                                style={{
                                  padding: "0.4rem 0.8rem",
                                  fontSize: "0.85rem",
                                }}
                                onClick={() => handleDelete(model)}
                                disabled={
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
                        {/* File uploads handled in form */}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddModels;
