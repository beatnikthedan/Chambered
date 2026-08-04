<template>
  <div class="armory-view">
    <!-- Top Filter & Search Bar matching ABS shelf controls -->
    <div class="filter-bar panel">
      <div class="search-inputs">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Filter by manufacturer, model, serial..." 
          class="search-input"
        />
        <select v-model="filterCaliber" class="filter-select">
          <option value="">All Calibers</option>
          <option v-for="cal in uniqueCalibers" :key="cal" :value="cal">{{ cal }}</option>
        </select>
        <select v-model="filterAction" class="filter-select">
          <option value="">All Actions</option>
          <option v-for="act in uniqueActions" :key="act" :value="act">{{ act }}</option>
        </select>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        Add Item
      </button>
    </div>

    <!-- Loading / Error States -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Unlocking weapon vault canisters...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-msg">Failed to retrieve Armory index. {{ error }}</p>
      <button @click="fetchArmoryItems" class="btn btn-primary">Refresh Cache</button>
    </div>

    <!-- Empty Vault State -->
    <div v-else-if="filteredArmoryItems.length === 0" class="empty-state panel">
      <p>No inventory items listed. Click below to add your first item.</p>
      <button class="btn btn-primary" style="margin-top:16px;" @click="openCreateModal">Add Item</button>
    </div>

    <!-- Armory Grid System -->
    <div v-else class="armory-grid">
      <div v-for="gun in filteredArmoryItems" :key="gun.id" class="gun-card">
        <div class="gun-header-img" :style="gun.imageUrl ? `background-image: url(${gun.imageUrl}); background-size: cover; background-position: center;` : ''">
          <div class="gun-action-type">{{ gun.actionType }}</div>
          
          <!-- Silhouette if no cover image selected -->
          <svg v-if="!gun.imageUrl" class="gun-silhouette" viewBox="0 0 160 60" fill="currentColor">
            <path v-if="isHandgun(gun.actionType)" d="M50 15h40a3 3 0 013 3v8a3 3 0 01-3 3H75l-8 22a2 2 0 01-2 1H55a2 2 0 01-2-2.5l7-21H50a3 3 0 01-3-3v-5.5a3 3 0 013-3z M68 29l7-2 M60 21h25" />
            <path v-else d="M20 25h120l5-3a2 2 0 012 0l4 3h10v3H135l-3-2H105l-4 8H90l2-8H40a2 2 0 01-2-1.5L30 25z M45 28h15 M115 28l2-4" />
          </svg>

          <div class="gun-badge-condition">
            <span :class="['badge', getConditionClass(gun.condition)]">{{ gun.condition || 'Good' }}</span>
          </div>
        </div>

        <div class="gun-card-body">
          <div class="gun-title-row">
            <h3 class="gun-title">{{ gun.manufacturer }} {{ gun.model }}</h3>
            <span class="gun-caliber">{{ gun.caliber }}</span>
          </div>

          <div class="gun-details">
            <div class="detail-row">
              <span class="detail-label">Serial Number</span>
              <span class="detail-value text-mono">{{ gun.serialNumber || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Vault</span>
              <span class="detail-value text-mono highlight-text-blue">{{ gun.storageLocation || 'Main Vault' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Asset Valuation</span>
              <span class="detail-value gold-text">${{ gun.currentValue ?? gun.purchasePrice ?? 0 }}</span>
            </div>
            <div class="detail-row tracker-row">
              <span class="detail-label">Round Balance</span>
              <div class="tracker-controls">
                <span class="detail-value text-mono highlight-text">{{ gun.roundCount }} rds</span>
                <button class="btn btn-secondary btn-mini" @click.stop="quickIncrementRounds(gun.id)" title="Quick Record +50 Rounds Fired">
                  +50
                </button>
              </div>
            </div>
          </div>

          <div class="gun-card-actions">
            <button class="btn btn-secondary btn-small" @click="openEditModal(gun)">
              Edit
            </button>
            <button class="btn btn-danger btn-small" @click="handleDelete(gun.id)">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Audiobookshelf Exact Center Tabbed Modal Dialog -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="abs-center-modal">
        <!-- Title Bar -->
        <div class="modal-title-bar">
          <div class="title-left">
            <span class="modal-title-icon"></span>
            <h3>{{ isEditMode ? 'Modify Entry' : 'Add Item' }}</h3>
          </div>
          <button class="modal-close-x-btn" @click="closeModal">×</button>
        </div>

        <!-- Horizontal Tab list across the top, exactly like Audiobookshelf -->
        <div class="modal-tabs-header-row">
          <button 
            type="button" 
            class="tab-btn" 
            :class="{ active: activeTab === 'general' }" 
            @click="activeTab = 'general'"
          >
            General
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            :class="{ active: activeTab === 'attachments' }" 
            @click="activeTab = 'attachments'"
          >
            Attachments
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            :class="{ active: activeTab === 'optics' }" 
            @click="activeTab = 'optics'"
          >
            Optics
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            :class="{ active: activeTab === 'accessories' }" 
            @click="activeTab = 'accessories'"
          >
            Accessories
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            :class="{ active: activeTab === 'loads' }" 
            @click="activeTab = 'loads'"
          >
            Loads
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            :class="{ active: activeTab === 'notes' }" 
            @click="activeTab = 'notes'"
          >
            Notes
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            :class="{ active: activeTab === 'maintenance' }" 
            @click="activeTab = 'maintenance'"
          >
            Maintenance
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            :class="{ active: activeTab === 'range' }" 
            @click="activeTab = 'range'"
          >
            Range History
          </button>
        </div>

        <!-- Tab Content Window with strict fixed height to prevent resizing -->
        <div class="modal-tabs-body-content">
          <!-- General Tab -->
          <div v-show="activeTab === 'general'" class="tab-pane">
            <div class="form-grid-columns">
              <div class="form-item">
                <label>Manufacturer *</label>
                <div class="dropdown-select-wrapper">
                  <select v-model="form.manufacturer" required class="full-width-select">
                    <option value="" disabled>Select Manufacturer</option>
                    <option v-for="mfg in manufacturerPresets" :key="mfg" :value="mfg">{{ mfg }}</option>
                    <option value="Custom">Custom Brand...</option>
                  </select>
                  <input 
                    v-if="form.manufacturer === 'Custom'" 
                    type="text" 
                    v-model="customManufacturer" 
                    placeholder="Enter custom brand..." 
                    class="custom-field-input" 
                    required
                  />
                </div>
              </div>

              <div class="form-item">
                <label>Model *</label>
                <div class="dropdown-select-wrapper">
                  <select v-model="form.model" required class="full-width-select">
                    <option value="" disabled>Select Model</option>
                    <option v-for="mod in modelPresets[form.manufacturer] || modelPresets['Custom']" :key="mod" :value="mod">{{ mod }}</option>
                    <option value="Custom">Custom Model...</option>
                  </select>
                  <input 
                    v-if="form.model === 'Custom'" 
                    type="text" 
                    v-model="customModel" 
                    placeholder="Enter custom model..." 
                    class="custom-field-input" 
                    required
                  />
                </div>
              </div>

              <!-- Description under Manufacturer and Model -->
              <div class="form-item full-row">
                <label>Description</label>
                <textarea v-model="form.notes" rows="2" placeholder="Sleek, short summary description of the item..."></textarea>
              </div>

              <div class="form-item">
                <label>Caliber *</label>
                <select v-model="form.caliber" required>
                  <option value="" disabled>Select Caliber</option>
                  <option v-for="cal in caliberPresets" :key="cal" :value="cal">{{ cal }}</option>
                </select>
              </div>

              <div class="form-item">
                <label>Action Type *</label>
                <select v-model="form.actionType" required>
                  <option v-for="act in actionTypePresets" :key="act" :value="act">{{ act }}</option>
                </select>
              </div>

              <div class="form-item">
                <label>Serial Number</label>
                <input type="text" v-model="form.serialNumber" placeholder="e.g. SN12345678" />
              </div>

              <div class="form-item">
                <label>Barrel Length (Inches)</label>
                <input type="number" step="0.01" v-model="form.barrelLengthInches" placeholder="e.g. 4.02" />
              </div>

              <div class="form-item">
                <label>Twist Rate</label>
                <input type="text" v-model="form.twistRate" placeholder="e.g. 1:10, 1:7" />
              </div>

              <div class="form-item">
                <label>Condition</label>
                <select v-model="form.condition">
                  <option v-for="cond in conditionPresets" :key="cond" :value="cond">{{ cond }}</option>
                </select>
              </div>

              <div class="form-item">
                <label>Purchase Price ($)</label>
                <input type="number" step="0.01" v-model="form.purchasePrice" placeholder="0.00" />
              </div>

              <div class="form-item">
                <label>Purchase Date</label>
                <input type="date" v-model="form.purchaseDateString" />
              </div>

              <div class="form-item">
                <label>Current Est. Value ($)</label>
                <input type="number" step="0.01" v-model="form.currentValue" placeholder="0.00" />
              </div>

              <div class="form-item">
                <label>Round Count (Cumulative)</label>
                <input type="number" v-model="form.roundCount" placeholder="0" />
              </div>

              <!-- Storage Location dropdown -->
              <div class="form-item">
                <label>Vault</label>
                <select v-model="form.storageLocation">
                  <option value="">-- Select Vault --</option>
                  <option v-for="loc in vaultLocations" :key="loc.id" :value="loc.name">{{ loc.name }}</option>
                </select>
              </div>

              <!-- Beneficiary / Legacy field at bottom -->
              <div class="form-item">
                <label>Legacy Beneficiary (Inheritor)</label>
                <input type="text" v-model="form.beneficiary" placeholder="Full name of beneficiary" />
              </div>
            </div>
          </div>

          <!-- Attachments Tab -->
          <div v-show="activeTab === 'attachments'" class="tab-pane">
            <!-- Cover Selection Frame with toggle source -->
            <div class="cover-selection-container">
              <label class="section-sub-label">Cover Artwork Selection</label>
              <div class="cover-flex-row">
                <div class="cover-preview-box">
                  <img v-if="form.imageUrl" :src="form.imageUrl" class="active-cover-img" alt="Cover Artwork" />
                  <div v-else class="no-cover-svg">
                    <p>No Cover Active</p>
                  </div>
                </div>
                <div class="cover-inputs">
                  <div class="source-select-row">
                    <label class="radio-label">
                      <input type="radio" v-model="coverSourceType" value="web" />
                      <span>Web URL</span>
                    </label>
                    <label class="radio-label" style="margin-left: 15px;">
                      <input type="radio" v-model="coverSourceType" value="upload" />
                      <span>Pick Uploaded Image</span>
                    </label>
                  </div>

                  <div v-if="coverSourceType === 'web'" class="cover-url-row" style="margin-top: 6px;">
                    <input type="text" v-model="form.imageUrl" placeholder="https://example.com/gun.png" />
                    <button type="button" class="btn btn-secondary" @click="clearCover">Clear</button>
                  </div>

                  <div v-else class="cover-url-row" style="margin-top: 6px;">
                    <select v-model="form.imageUrl" class="full-width-select">
                      <option value="">-- Select uploaded image file --</option>
                      <option v-for="img in uploadedImagesOnly" :key="img.filename" :value="img.mockUrl">
                        {{ img.filename }} ({{ img.category }})
                      </option>
                    </select>
                    <button type="button" class="btn btn-secondary" @click="clearCover">Clear</button>
                  </div>
                  <p class="field-hint">Paste an image link or select one of your uploaded images to bind it as the library cover.</p>
                </div>
              </div>
            </div>

            <div class="dropdown-divider-line"></div>

            <!-- Uploads Panel -->
            <div class="uploads-panel">
              <label class="section-sub-label">Upload New Documents / Images</label>
              <div class="upload-controls-row">
                <div class="upload-file-selector">
                  <input type="file" @change="handleFileSelection" id="attachment-file-input" style="display:none;" />
                  <button type="button" class="btn btn-secondary" onclick="document.getElementById('attachment-file-input').click()">
                    Browse File
                  </button>
                  <span class="selected-file-name">{{ selectedFileName || 'No file selected' }}</span>
                </div>
                
                <div class="category-select-col">
                  <select v-model="selectedFileCategory" class="mini-cat-select">
                    <option v-for="cat in attachmentCategoryPresets" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>

                <button type="button" class="btn btn-primary" @click="uploadAttachment" :disabled="!selectedFileName">
                  Upload Attachment
                </button>
              </div>

              <!-- Attachments List Grid -->
              <div class="attachments-list-section">
                <label class="list-title">Attached Media & Manuals ({{ attachments.length }})</label>
                <div class="table-scroll-wrapper" style="max-height: 180px; overflow-y: auto; border: 1px solid var(--border-solid); border-radius: var(--radius-sm);">
                  <table class="attachments-table" v-if="attachments.length > 0">
                    <thead>
                      <tr>
                        <th>Filename</th>
                        <th>Category</th>
                        <th>Size</th>
                        <th>Date Added</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="file in attachments" :key="file.id">
                        <td>
                          <!-- Fully Clickable to open Preview document -->
                          <a href="#" class="clickable-attachment-link" @click.prevent="openAttachmentPreview(file)">
                            {{ file.filename }}
                          </a>
                        </td>
                        <td>
                          <span class="badge badge-info">{{ file.category }}</span>
                        </td>
                        <td>{{ file.size }}</td>
                        <td>{{ file.dateAdded }}</td>
                        <td class="action-cell">
                          <button 
                            v-if="isImageFile(file.filename)" 
                            type="button" 
                            class="btn btn-secondary btn-mini-inline" 
                            @click="setAsCoverFromFile(file)"
                          >
                            Cover
                          </button>
                          <button type="button" class="btn btn-danger btn-mini-inline" @click="removeAttachment(file.id)">
                            Delete
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="empty-list-placeholder" v-else style="border: none;">
                    No attachments loaded for this item.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Optics Tab -->
          <div v-show="activeTab === 'optics'" class="tab-pane">
            <div class="tab-intro">
              <h4>Optics & Sighting Solutions</h4>
              <p>Configure Scopes, Iron Sights, or Red-Dot configurations mounted on this item.</p>
            </div>
            
            <div class="optics-form-box">
              <div class="form-grid-columns">
                <div class="form-item">
                  <label>Optic Manufacturer</label>
                  <input type="text" v-model="form.opticManufacturer" placeholder="e.g. Trijicon, Vortex, Sig Sauer" />
                </div>
                <div class="form-item">
                  <label>Optic Model</label>
                  <input type="text" v-model="form.opticModel" placeholder="e.g. RMR Type 2, Strike Eagle 1-6x" />
                </div>
                <div class="form-item">
                  <label>Reticle Specification</label>
                  <input type="text" v-model="form.opticReticle" placeholder="e.g. 3.25 MOA Dot, AR-BDC3" />
                </div>
                <div class="form-item">
                  <label>Serial Tag</label>
                  <input type="text" v-model="form.opticSerial" placeholder="Scope Serial" />
                </div>
                <div class="form-item">
                  <label>Battery Specification</label>
                  <input type="text" v-model="form.opticBattery" placeholder="e.g. CR2032" />
                </div>
                <div class="form-item align-center-checkbox">
                  <label class="checkbox-container">
                    <input type="checkbox" v-model="form.isOpticMounted" />
                    <span class="checkmark"></span>
                    Currently Mounted to Armory Item
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Accessories Tab (Custom dynamic list instead of static checklists) -->
          <div v-show="activeTab === 'accessories'" class="tab-pane">
            <div class="tab-intro">
              <h4>Accessories & Upgrades</h4>
              <p>Register lights, suppressors, slings, and custom modifications active on this weapon.</p>
            </div>

            <div class="add-accessory-form-row">
              <input 
                type="text" 
                v-model="newAccessoryName" 
                placeholder="Enter accessory tag (e.g. Surefire X300 Turbo, Magpul Sling...)" 
                class="flex-grow-input"
                @keyup.enter="addAccessory"
              />
              <button type="button" class="btn btn-primary" @click="addAccessory">
                Add Accessory
              </button>
            </div>

            <div class="accessories-dynamic-list-section">
              <label class="list-title">Active Accessories ({{ accessoriesList.length }})</label>
              <div class="accessories-scroll-box">
                <div v-for="(acc, index) in accessoriesList" :key="index" class="accessory-dynamic-card">
                  <div class="card-left">
                    <span class="bullet-dot"></span>
                    <span class="accessory-item-text">{{ acc }}</span>
                  </div>
                  <button type="button" class="btn btn-danger btn-mini-inline" @click="removeAccessory(index)" title="Remove item">
                    Delete
                  </button>
                </div>
                <div class="empty-list-placeholder" v-if="accessoriesList.length === 0">
                  No custom accessories registered. Type above to add an item.
                </div>
              </div>
            </div>
          </div>

          <!-- Loads Tab (Ammo Cases Assigned) -->
          <div v-show="activeTab === 'loads'" class="tab-pane">
            <div class="tab-intro">
              <h4>Assigned Loads & Bullet Lots</h4>
              <p>Display inventory ammunition lot boxes currently assigned or compatible with this item.</p>
            </div>

            <div class="linked-lots-wrapper">
              <div class="lots-list-display" v-if="filteredAmmoLots.length > 0">
                <table class="lots-compact-table">
                  <thead>
                    <tr>
                      <th>Lot Number</th>
                      <th>Ammo Type</th>
                      <th>Spec Detal</th>
                      <th>Available stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="lot in filteredAmmoLots" :key="lot.id">
                      <td class="text-mono highlight-text-blue">#{{ lot.lotNumber }}</td>
                      <td>
                        <strong>{{ lot.manufacturer || 'Custom Handload' }}</strong>
                      </td>
                      <td>
                        <span class="badge badge-info">{{ lot.caliber }}</span>
                        <span v-if="lot.notes" class="lot-row-notes-tag" :title="lot.notes">Notes</span>
                      </td>
                      <td>
                        <span class="count-pill">{{ lot.quantity }} rds</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="no-lots-msg" v-else>
                No active munitions lot cases are matching this item's caliber ({{ form.caliber || 'Unspecified' }}). Complete records inside the Munitions dashboard.
              </div>
            </div>
          </div>

          <!-- Rich-Notes tab with format toolbars -->
          <div v-show="activeTab === 'notes'" class="tab-pane">
            <div class="tab-intro">
              <h4>Advanced Logs & Documentation</h4>
              <p>Compose rich notes, trigger history, or documentation in standard markdown syntax.</p>
            </div>

            <div class="markdown-editor-pane">
              <!-- Formatting Bar -->
              <div class="markdown-toolbar">
                <button type="button" class="toolbar-btn" @click="insertMarkdown('**')" title="Bold (Ctrl+B)"><strong>B</strong></button>
                <button type="button" class="toolbar-btn" @click="insertMarkdown('*')" title="Italic (Ctrl+I)"><em>I</em></button>
                <button type="button" class="toolbar-btn" @click="insertMarkdown('__')" title="Underline"><u>U</u></button>
                <button type="button" class="toolbar-btn" @click="insertMarkdown('`')" title="Code Codeblock"><code>&lt;&gt;</code></button>
                <button type="button" class="toolbar-btn" @click="insertMarkdown('> ')" title="Quote block"><strong>“</strong></button>
                <button type="button" class="toolbar-btn" @click="insertMarkdown('- ')" title="Bullet point list"><strong>• List</strong></button>
                <button type="button" class="toolbar-btn text-format-indicator" disabled>Markdown Editor</button>
              </div>

              <!-- Main Split Layout Editor vs Live Preview -->
              <div class="markdown-split-panel">
                <div class="editor-col">
                  <textarea 
                    id="markdown-textarea-box" 
                    v-model="form.notesMarkdown" 
                    placeholder="Provide detailed logs or target records in markdown..."
                  ></textarea>
                </div>
                <div class="preview-col">
                  <label class="preview-tag-title">Live Formatted Preview</label>
                  <div class="markdown-rendered-view" v-html="renderMarkdown(form.notesMarkdown)"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Maintenance Tab (Tasks with clean, repair, site-in, spot check) -->
          <div v-show="activeTab === 'maintenance'" class="tab-pane">
            <div class="tab-intro">
              <h4>Maintenance & Servicing Tasks</h4>
              <p>Add scheduled cleanings, repairs, target checkups, or site-in checks.</p>
            </div>

            <!-- Task Insertion Box -->
            <div class="task-insertion-panel">
              <div class="task-form-row">
                <div class="task-item-input-col" style="flex: 2;">
                  <label>Task Description *</label>
                  <input type="text" v-model="newTaskText" placeholder="e.g. Bore cleaning, replacement recoil spring..." />
                </div>

                <div class="task-item-input-col" style="flex: 1;">
                  <label>Category *</label>
                  <select v-model="newTaskCategory">
                    <option value="Clean">Clean</option>
                    <option value="Repair">Repair</option>
                    <option value="Site-In">Site-In</option>
                    <option value="Spot Check">Spot Check</option>
                  </select>
                </div>

                <div class="task-item-input-col" style="flex: 1;">
                  <label>Due Date</label>
                  <input type="date" v-model="newTaskDueDate" />
                </div>

                <div class="task-item-input-col" style="flex: auto; align-items: center; justify-content: flex-end;">
                  <label class="checkbox-container" style="padding-left: 24px; font-size: 11px; margin-top: 18px;">
                    <input type="checkbox" v-model="newTaskNotification" />
                    <span class="checkmark"></span>
                    Notify
                  </label>
                </div>

                <button type="button" class="btn btn-primary" @click="addMaintenanceTask" style="margin-top: 14px;">
                  Add Task
                </button>
              </div>
            </div>

            <!-- Task listings with filters -->
            <div class="task-listings-section">
              <div class="listings-header-row">
                <h5>Registered Tasks ({{ filteredTasks.length }})</h5>
                <div class="listings-filter-controls">
                  <select v-model="taskFilterStatus" class="mini-table-filter">
                    <option value="All">All Statuses</option>
                    <option value="Active">Active Only</option>
                    <option value="Completed">Completed Only</option>
                  </select>
                  <select v-model="taskFilterCategory" class="mini-table-filter">
                    <option value="All">All Categories</option>
                    <option value="Clean">Clean</option>
                    <option value="Repair">Repair</option>
                    <option value="Site-In">Site-In</option>
                    <option value="Spot Check">Spot Check</option>
                  </select>
                </div>
              </div>

              <!-- Task Table List -->
              <div class="tasks-table-scroll" style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-solid); border-radius: var(--radius-sm);">
                <table class="tasks-master-table" v-if="filteredTasks.length > 0">
                  <thead>
                    <tr>
                      <th style="width: 40px;"></th>
                      <th>Task description</th>
                      <th>Category</th>
                      <th>Due Date</th>
                      <th>Notify</th>
                      <th>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="task in filteredTasks" :key="task.id" :class="{ completed: task.isCompleted }">
                      <td>
                        <input 
                          type="checkbox" 
                          :checked="task.isCompleted" 
                          @change="toggleTaskComplete(task.id)" 
                          class="task-row-checkbox"
                        />
                      </td>
                      <td class="task-text-cell">{{ task.description }}</td>
                      <td>
                        <span :class="['badge', getTaskCategoryClass(task.category)]">{{ task.category }}</span>
                      </td>
                      <td class="text-mono">{{ task.dueDate || 'N/A' }}</td>
                      <td class="text-center">{{ task.enableNotifications ? 'Yes' : 'No' }}</td>
                      <td>
                        <button type="button" class="btn btn-danger btn-mini-inline" @click="removeMaintenanceTask(task.id)">
                          Delete
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="empty-list-placeholder" v-else style="border: none;">
                  No maintenance tasks match the active filters.
                </div>
              </div>
            </div>
          </div>

          <!-- Range History Tab with Expandable shot details -->
          <div v-show="activeTab === 'range'" class="tab-pane">
            <div class="tab-intro">
              <h4>Range Visit & Shot Records</h4>
              <p>Expand rows to inspect target sheets, group sizing, velocities, and range parameters.</p>
            </div>

            <div class="range-history-panel-scroll">
              <div class="expandable-accordion-list">
                <div 
                  v-for="session in rangeSessions" 
                  :key="session.id" 
                  class="accordion-item-box"
                  :class="{ expanded: activeAccordionId === session.id }"
                >
                  <!-- Header trigger row -->
                  <div class="accordion-header-trigger" @click="toggleAccordion(session.id)">
                    <div class="trigger-left">
                      <span class="expand-icon">{{ activeAccordionId === session.id ? '▼' : '▶' }}</span>
                      <strong class="session-date-tag">{{ session.date }}</strong>
                      <span class="session-location-tag">{{ session.location }}</span>
                    </div>
                    <div class="trigger-right">
                      <span class="session-count-tag badge">{{ session.roundsFired }} rounds fired</span>
                    </div>
                  </div>

                  <!-- Expanded detail content section -->
                  <div class="accordion-content" v-show="activeAccordionId === session.id">
                    <div class="session-stats-grid">
                      <div class="stat-bubble">
                        <span>Target Sighting Distance</span>
                        <strong>{{ session.distance }} yards</strong>
                      </div>
                      <div class="stat-bubble">
                        <span>Tested Group Spread</span>
                        <strong>{{ session.groupSize }}" spread</strong>
                      </div>
                      <div class="stat-bubble">
                        <span>Chronograph Velocity</span>
                        <strong>{{ session.velocityFps || 'N/A' }} FPS</strong>
                      </div>
                      <div class="stat-bubble">
                        <span>Fired Bullet Type</span>
                        <strong>{{ session.bulletLoaded || 'Factory FMJ' }}</strong>
                      </div>
                    </div>

                    <div class="session-notes-box">
                      <label>Target Field Logs</label>
                      <p>{{ session.notes || 'No custom notes logged.' }}</p>
                    </div>

                    <div class="session-targets-row" v-if="session.targets && session.targets.length > 0">
                      <label>Target Sheet Scans</label>
                      <div class="targets-preview-flex">
                        <div v-for="targ in session.targets" :key="targ" class="target-mock-preview-card" @click="previewTargetSheet(targ)">
                          Target Sheet ({{ targ }})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="empty-list-placeholder" v-if="rangeSessions.length === 0">
                  No range visit logs saved for this weapon item.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dialog Footer -->
        <div class="modal-footer-row-container">
          <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button type="button" class="btn btn-primary" :disabled="isSaving" @click="saveArmoryItem">
            {{ isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Save Item') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Clickable Attachment Mock Viewer Modal overlay -->
    <div v-if="showAttachmentViewer" class="modal-overlay" @click.self="closeAttachmentPreview" style="z-index: 2000;">
      <div class="abs-center-modal" style="width: 580px; height: 420px;">
        <div class="modal-title-bar">
          <div class="title-left">
            <span></span>
            <h3>Document Preview</h3>
          </div>
          <button class="modal-close-x-btn" @click="closeAttachmentPreview">×</button>
        </div>
        <div class="modal-tabs-body-content" style="height: 280px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 14px; text-align: center;">
          <div style="font-size: 50px;"></div>
          <h4 class="text-mono" style="color: var(--color-primary);">{{ previewFile.filename }}</h4>
          <span class="badge badge-info" style="font-size: 11px;">Category: {{ previewFile.category }}</span>
          <p class="field-hint" style="max-width: 400px; line-height: 1.5;">This file is stored securely on your server. Click the simulated download button below to load this attachment onto your device.</p>
        </div>
        <div class="modal-footer-row-container" style="height: 60px;">
          <button type="button" class="btn btn-secondary" @click="closeAttachmentPreview">Close Preview</button>
          <button type="button" class="btn btn-primary" @click="simulateDownload(previewFile.filename)">
            Download ({{ previewFile.size }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { store } from '../store'

const armoryItems = ref([])
const ammoLots = ref([])
const loading = ref(true)
const error = ref('')
const isSaving = ref(false)

const handleAuthError = (res) => {
  if (res.status === 401) {
    alert("Your session has expired. Redirecting to login page...")
    store.user = null
    store.isAuthenticated = false
    window.location.href = '/login'
    return true
  }
  return false
}

// Tabs active control
const activeTab = ref('general')

// Filters
const searchQuery = ref('')
const filterCaliber = ref('')
const filterAction = ref('')

// Dropdowns Presets
const manufacturerPresets = [
  "Glock", "Ruger", "Smith & Wesson", "Sig Sauer", "Springfield Armory", 
  "Colt", "Winchester", "Remington", "Beretta", "Taurus", "CZ", 
  "Browning", "Savage Arms", "Walther", "Henry Repeating Arms"
]

const modelPresets = {
  "Glock": ["19 Gen 5", "17 Gen 5", "43X", "34 Gen 5", "20 Gen 5"],
  "Ruger": ["10/22", "Mark IV", "LCP MAX", "American Rifle", "GP100"],
  "Smith & Wesson": ["M&P 9 Shield Plus", "Model 686", "M&P 15-22", "Model 29"],
  "Sig Sauer": ["P320", "P365", "M17", "P226", "MCX Virtus"],
  "Springfield Armory": ["Hellcat", "Echelon", "M1A", "110 Mil-Spec"],
  "Colt": ["Python", "M4 Carbine", "1911 Gold Cup", "Anaconda"],
  "Winchester": ["Model 1894", "Model 70", "SXP Defender"],
  "Remington": ["Model 870", "Model 700"],
  "Beretta": ["M9A4", "92FS", "A300 Patrol", "APX A1"],
  "Taurus": ["G3c", "Judge", "TX22", "Model 856"],
  "CZ": ["P-10 C", "75 B", "Shadow 2", "457 Training"],
  "Browning": ["BAR", "Citori", "Buck Mark"],
  "Savage Arms": ["Model 110", "A22"],
  "Walther": ["PDP", "PPQ", "PPK"],
  "Henry Repeating Arms": ["Golden Boy", "Big Boy Brass"],
  "Custom": ["Other Model..."]
}

const caliberPresets = [
  "9mm Luger", ".22 LR", ".45 ACP", ".357 Magnum", ".38 Special", 
  ".223 Remington", "5.56x45mm NATO", ".308 Winchester", "7.62x39mm", 
  "12 Gauge", "20 Gauge", "6.5 Creedmoor", "300 AAC Blackout", "10mm Auto"
]

const actionTypePresets = [
  "Semi-Automatic", "Bolt Action", "Lever Action", "Revolver", "Break Action", "Pump Action", "Single Shot"
]

const conditionPresets = [
  "New / Unfired (100%)", "Excellent (98%)", "Very Good (95%)", "Good (90%)", "Fair (80%)", "Poor (60%)"
]

const vaultLocations = ref([])

const fetchVaultLocations = async () => {
  try {
    const url = store.activeArsenalId 
      ? `/api/vaults/locations?arsenalId=${store.activeArsenalId}` 
      : '/api/vaults/locations'
    const res = await fetch(url)
    if (res.ok) {
      vaultLocations.value = await res.json()
    }
  } catch (err) {
    console.error('Failed to load vault locations', err)
  }
}

const attachmentCategoryPresets = [
  "Owner's Manual", "Purchase Receipt", "Target Sheet", "Warranty Certificate", "Schematic Diagram", "Other Document"
]

// Modal control
const showModal = ref(false)
const isEditMode = ref(false)

const customManufacturer = ref('')
const customModel = ref('')

// Form state
const form = ref({
  id: 0,
  manufacturer: '',
  model: '',
  caliber: '',
  barrelLengthInches: null,
  twistRate: '',
  actionType: 'Semi-Automatic',
  serialNumber: '',
  notes: '',
  purchasePrice: null,
  purchaseDateString: '',
  currentValue: null,
  condition: 'Good (90%)',
  imageUrl: '',
  roundCount: 0,
  beneficiary: '',
  storageLocation: 'Main Vault',
  notesMarkdown: '',
  
  // Custom Optics
  opticManufacturer: '',
  opticModel: '',
  opticReticle: '',
  opticSerial: '',
  opticBattery: '',
  isOpticMounted: false
})

// Attachments local state
const selectedFileName = ref('')
const selectedFileCategory = ref("Owner's Manual")
const attachments = ref([])
const coverSourceType = ref('web')

// Document Mock Preview Modal Controls
const showAttachmentViewer = ref(false)
const previewFile = ref(null)

const openAttachmentPreview = (file) => {
  previewFile.value = file
  showAttachmentViewer.value = true
}

const closeAttachmentPreview = () => {
  showAttachmentViewer.value = false
  previewFile.value = null
}

const simulateDownload = (filename) => {
  const blob = new Blob([`Simulated document bytes for: ${filename}`], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const handleFileSelection = (e) => {
  if (e.target.files && e.target.files.length) {
    selectedFileName.value = e.target.files[0].name
  }
}

const isImageFile = (filename) => {
  if (!filename) return false
  const ext = filename.toLowerCase().split('.').pop()
  return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)
}

// Uploaded images list helper
const uploadedImagesOnly = computed(() => {
  return attachments.value.filter(a => isImageFile(a.filename))
})

const setAsCoverFromFile = (file) => {
  form.value.imageUrl = file.mockUrl || "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=600"
}

const clearCover = () => {
  form.value.imageUrl = ''
}

const uploadAttachment = () => {
  if (!selectedFileName.value) return
  
  // Set mockUrl if it's an image
  let mockUrl = ''
  if (isImageFile(selectedFileName.value)) {
    mockUrl = "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=600"
  }

  attachments.value.push({
    id: Date.now(),
    filename: selectedFileName.value,
    category: selectedFileCategory.value,
    size: "1.4 MB",
    dateAdded: new Date().toISOString().split('T')[0],
    mockUrl: mockUrl
  })
  selectedFileName.value = ''
}

const removeAttachment = (id) => {
  attachments.value = attachments.value.filter(a => a.id !== id)
}

// Dynamic accessories list state
const accessoriesList = ref([])
const newAccessoryName = ref('')

const addAccessory = () => {
  const name = newAccessoryName.value.trim()
  if (!name) return
  if (!accessoriesList.value.includes(name)) {
    accessoriesList.value.push(name)
  }
  newAccessoryName.value = ''
}

const removeAccessory = (index) => {
  accessoriesList.value.splice(index, 1)
}

// Simple Markdown formatting helper
const insertMarkdown = (syntax) => {
  const box = document.getElementById('markdown-textarea-box')
  if (!box) return

  const start = box.selectionStart
  const end = box.selectionEnd
  const origText = form.value.notesMarkdown || ''
  const selectedText = origText.substring(start, end)
  
  let result = ''
  if (syntax === '- ' || syntax === '> ') {
    result = origText.substring(0, start) + '\n' + syntax + selectedText + origText.substring(end)
  } else {
    result = origText.substring(0, start) + syntax + selectedText + syntax + origText.substring(end)
  }

  form.value.notesMarkdown = result
  
  // Refocus
  setTimeout(() => {
    box.focus()
    const offset = start + syntax.length
    box.setSelectionRange(offset, offset + selectedText.length)
  }, 50)
}

// Simple dynamic inline markdown parser
const renderMarkdown = (text) => {
  if (!text) return '<p style="color: var(--text-muted); font-style: italic;">No formatted logs created yet. Use formatting bar options above.</p>'
  
  // Convert standard symbols securely
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  // Underline
  html = html.replace(/__(.*?)__/g, '<u>$1</u>')
  // Blockquotes
  html = html.replace(/^&gt;\s+(.*?)(?:<br>|$)/gm, '<blockquote style="border-left: 3px solid var(--color-primary); padding-left: 10px; margin: 6px 0; color: var(--text-secondary);">$1</blockquote>')
  // Lists
  html = html.replace(/^-\s+(.*?)(?:<br>|$)/gm, '<li style="margin-left: 18px; color: var(--text-primary);">$1</li>')
  // Inline code tags
  html = html.replace(/`(.*?)`/g, '<code style="background-color: #17181f; padding: 2px 6px; border-radius: 4px; font-family: monospace; border: 1px solid var(--border-solid); color: #e5c158;">$1</code>')

  return html
}

// Maintenance task list state
const maintenanceTasks = ref([])
const newTaskText = ref('')
const newTaskCategory = ref('Clean')
const newTaskDueDate = ref('')
const newTaskNotification = ref(false)

const taskFilterStatus = ref('All')
const taskFilterCategory = ref('All')

const addMaintenanceTask = () => {
  const desc = newTaskText.value.trim()
  if (!desc) return

  maintenanceTasks.value.push({
    id: Date.now(),
    description: desc,
    category: newTaskCategory.value,
    dueDate: newTaskDueDate.value || null,
    enableNotifications: newTaskNotification.value,
    isCompleted: false
  })

  newTaskText.value = ''
  newTaskDueDate.value = ''
  newTaskNotification.value = false
}

const toggleTaskComplete = (id) => {
  const task = maintenanceTasks.value.find(t => task.id === id || t.id === id)
  if (task) {
    task.isCompleted = !task.isCompleted
  }
}

const removeMaintenanceTask = (id) => {
  maintenanceTasks.value = maintenanceTasks.value.filter(t => t.id !== id)
}

const getTaskCategoryClass = (cat) => {
  if (cat === 'Clean') return 'badge-success'
  if (cat === 'Repair') return 'badge-danger'
  if (cat === 'Site-In') return 'badge-warning'
  return 'badge-info'
}

const filteredTasks = computed(() => {
  return maintenanceTasks.value.filter(task => {
    const statusMatch = taskFilterStatus.value === 'All' || 
      (taskFilterStatus.value === 'Active' && !task.isCompleted) || 
      (taskFilterStatus.value === 'Completed' && task.isCompleted)

    const categoryMatch = taskFilterCategory.value === 'All' || task.category === taskFilterCategory.value
    return statusMatch && categoryMatch
  })
})

// Range History accordion layout state
const rangeSessions = ref([])
const activeAccordionId = ref(null)

const toggleAccordion = (id) => {
  if (activeAccordionId.value === id) {
    activeAccordionId.value = null
  } else {
    activeAccordionId.value = id
  }
}

const previewTargetSheet = (targetId) => {
  alert(`Previewing Target Sheet [${targetId}] shot group image catalog!`)
}

// Unique list aggregators
const uniqueCalibers = computed(() => {
  const cals = armoryItems.value.map(f => f.caliber).filter(Boolean)
  return [...new Set(cals)].sort()
})

const uniqueActions = computed(() => {
  const acts = armoryItems.value.map(f => f.actionType).filter(Boolean)
  return [...new Set(acts)].sort()
})

const filteredArmoryItems = computed(() => {
  return armoryItems.value.filter(gun => {
    const textMatch = !searchQuery.value || 
      [gun.manufacturer, gun.model, gun.serialNumber, gun.caliber]
        .some(v => v && v.toLowerCase().includes(searchQuery.value.toLowerCase()))
    
    const caliberMatch = !filterCaliber.value || gun.caliber === filterCaliber.value
    const actionMatch = !filterAction.value || gun.actionType === filterAction.value

    return textMatch && caliberMatch && actionMatch
  })
})

const filteredAmmoLots = computed(() => {
  if (!form.value.caliber) return []
  return ammoLots.value.filter(lot => lot.caliber.toLowerCase() === form.value.caliber.toLowerCase())
})

const isHandgun = (action) => {
  if (!action) return false
  const l = action.toLowerCase()
  return l.includes('pistol') || l.includes('revolver') || l.includes('handgun') || l.includes('semi-automatic')
}

const getConditionClass = (cond) => {
  if (!cond) return 'badge-success'
  const c = cond.toLowerCase()
  if (c.includes('unfired') || c.includes('excel') || c.includes('very')) return 'badge-success'
  if (c.includes('good') || c.includes('fair')) return 'badge-warning'
  return 'badge-danger'
}

const fetchArmoryItems = async () => {
  loading.value = true
  error.value = ''
  try {
    const url = store.activeArsenalId 
      ? `/api/armory?arsenalId=${store.activeArsenalId}` 
      : '/api/armory'
    const res = await fetch(url)
    if (handleAuthError(res)) return
    if (res.ok) {
      armoryItems.value = await res.json()
    } else {
      error.value = `Error loading: ${res.status}`
    }
  } catch (err) {
    error.value = 'Failed to fetch armory items.'
  } finally {
    loading.value = false
  }
}

const fetchAmmoLots = async () => {
  try {
    const res = await fetch('/api/settings/ammo-lots')
    if (res.ok) {
      ammoLots.value = await res.json()
    } else {
      const altRes = await fetch('/api/munitions')
      if (altRes.ok) {
        ammoLots.value = await altRes.json()
      }
    }
  } catch (err) {
    console.error('Ammo lots loading bypassed.', err)
  }
}

const quickIncrementRounds = async (id) => {
  try {
    const res = await fetch(`/api/armory/${id}/increment-rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 50 })
    })
    if (handleAuthError(res)) return
    if (res.ok) {
      const data = await res.json()
      const gun = armoryItems.value.find(f => f.id === id)
      if (gun) {
        gun.roundCount = data.roundCount
      }
    }
  } catch (err) {
    console.error('Increment rounds error', err)
  }
}

const openCreateModal = () => {
  isEditMode.value = false
  activeTab.value = 'general'
  customManufacturer.value = ''
  customModel.value = ''
  coverSourceType.value = 'web'
  
  accessoriesList.value = []
  maintenanceTasks.value = []
  rangeSessions.value = []

  form.value = {
    id: 0,
    manufacturer: 'Glock',
    model: '19 Gen 5',
    caliber: '9mm Luger',
    barrelLengthInches: 4.02,
    twistRate: '1:10',
    actionType: 'Semi-Automatic',
    serialNumber: '',
    notes: '',
    purchasePrice: null,
    purchaseDateString: '',
    currentValue: null,
    condition: 'Good (90%)',
    imageUrl: '',
    roundCount: 0,
    beneficiary: '',
    storageLocation: 'Main Vault',
    notesMarkdown: '',
    
    opticManufacturer: '',
    opticModel: '',
    opticReticle: '',
    opticSerial: '',
    opticBattery: '',
    isOpticMounted: false
  }

  attachments.value = [
    { id: 101, filename: "Glock_19_Gen5_Manual.pdf", category: "Owner's Manual", size: "3.4 MB", dateAdded: "2026-08-01" },
    { id: 102, filename: "Glock_Promo_Flyer.png", category: "Other Document", size: "1.2 MB", dateAdded: "2026-08-01", mockUrl: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=600" }
  ]
  showModal.value = true
}

const openEditModal = (gun) => {
  isEditMode.value = true
  activeTab.value = 'general'
  customManufacturer.value = ''
  customModel.value = ''
  coverSourceType.value = gun.imageUrl ? 'web' : 'web'

  // Convert Date object to YYYY-MM-DD for date HTML element
  let dateString = ''
  if (gun.purchaseDate) {
    dateString = gun.purchaseDate.split('T')[0]
  }

  form.value = { 
    ...gun, 
    purchaseDateString: dateString,
    beneficiary: gun.beneficiary || '',
    storageLocation: gun.storageLocation || 'Main Vault',
    notesMarkdown: gun.notesMarkdown || '',
    opticManufacturer: gun.opticManufacturer || '',
    opticModel: gun.opticModel || '',
    opticReticle: gun.opticReticle || '',
    opticSerial: gun.opticSerial || '',
    opticBattery: gun.opticBattery || '',
    isOpticMounted: gun.isOpticMounted || false
  }

  // Parse custom list arrays from JSON columns
  try {
    accessoriesList.value = gun.accessoriesListJson ? JSON.parse(gun.accessoriesListJson) : []
  } catch (err) {
    accessoriesList.value = []
  }

  try {
    maintenanceTasks.value = gun.maintenanceTasksJson ? JSON.parse(gun.maintenanceTasksJson) : []
  } catch (err) {
    maintenanceTasks.value = []
  }

  try {
    rangeSessions.value = gun.rangeHistoryJson ? JSON.parse(gun.rangeHistoryJson) : []
  } catch (err) {
    rangeSessions.value = []
  }

  // Fallback to high fidelity seeded maintenance tasks if list is empty
  if (maintenanceTasks.value.length === 0) {
    maintenanceTasks.value = [
      { id: 201, description: "Detailed barrel solvent clean and re-lubrication", category: "Clean", dueDate: "2026-08-10", enableNotifications: true, isCompleted: false },
      { id: 202, description: "Check optic locking block screw torque", category: "Spot Check", dueDate: "2026-07-28", enableNotifications: false, isCompleted: true }
    ]
  }

  // Fallback to high fidelity range history sessions if list is empty
  if (rangeSessions.value.length === 0) {
    rangeSessions.value = [
      { 
        id: 301, 
        date: "2026-08-01", 
        location: "Plinking City Outdoor Range", 
        roundsFired: 150, 
        distance: 15, 
        groupSize: 1.8, 
        velocityFps: 1145, 
        bulletLoaded: "Factory Federal 115gr FMJ", 
        notes: "Excellent shooting session. Trigger pulls cleanly, holds zero precisely.", 
        targets: ["Sheet-101-Bullseye", "Sheet-102-Silhouette"] 
      },
      { 
        id: 302, 
        date: "2026-07-15", 
        location: "Silver Bullet Indoor Complex", 
        roundsFired: 50, 
        distance: 10, 
        groupSize: 2.3, 
        velocityFps: null, 
        bulletLoaded: "Factory Remington 115gr", 
        notes: "Quick function spot-test. Checked target cycles correctly.", 
        targets: [] 
      }
    ]
  }

  attachments.value = [
    { id: 101, filename: `${gun.model.replace(/\s+/g, '_')}_Specifications_Doc.pdf`, category: "Owner's Manual", size: "1.8 MB", dateAdded: "2026-07-28" },
    { id: 102, filename: `${gun.model.replace(/\s+/g, '_')}_Photo.png`, category: "Other Document", size: "1.1 MB", dateAdded: "2026-07-28", mockUrl: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=600" }
  ]
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveArmoryItem = async () => {
  isSaving.value = true
  try {
    const url = isEditMode.value ? `/api/armory/${form.value.id}` : '/api/armory'
    const method = isEditMode.value ? 'PUT' : 'POST'
    
    // Resolve Custom Brand overrides
    let finalMfg = form.value.manufacturer
    if (finalMfg === 'Custom' && customManufacturer.value) {
      finalMfg = customManufacturer.value.trim()
    }
    
    let finalMod = form.value.model
    if (finalMod === 'Custom' && customModel.value) {
      finalMod = customModel.value.trim()
    }

    const payload = {
      ...form.value,
      manufacturer: finalMfg,
      model: finalMod,
      barrelLengthInches: parseFloat(form.value.barrelLengthInches) || 0,
      purchasePrice: form.value.purchasePrice ? parseFloat(form.value.purchasePrice) : null,
      currentValue: form.value.currentValue ? parseFloat(form.value.currentValue) : null,
      purchaseDate: form.value.purchaseDateString ? new Date(form.value.purchaseDateString).toISOString() : null,
      arsenalId: store.activeArsenalId,
      
      // Serialize arrays as JSON strings to C# string columns
      accessoriesListJson: JSON.stringify(accessoriesList.value),
      maintenanceTasksJson: JSON.stringify(maintenanceTasks.value),
      rangeHistoryJson: JSON.stringify(rangeSessions.value)
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (handleAuthError(res)) return

    if (res.ok) {
      await fetchArmoryItems()
      closeModal()
    } else {
      const text = await res.text()
      alert(`Save failed: ${text || res.statusText}`)
    }
  } catch (err) {
    console.error(err)
    alert('Failed to connect to the backend server.')
  } finally {
    isSaving.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('Are you absolutely sure you want to delete this armory item from inventory? This action is permanent.')) return
  
  try {
    const res = await fetch(`/api/armory/${id}`, { method: 'DELETE' })
    if (handleAuthError(res)) return
    if (res.ok) {
      armoryItems.value = armoryItems.value.filter(f => f.id !== id)
    } else {
      alert('Delete failed.')
    }
  } catch (err) {
    console.error(err)
  }
}

watch(() => store.activeArsenalId, () => {
  fetchArmoryItems()
  fetchVaultLocations()
})

onMounted(() => {
  fetchArmoryItems()
  fetchAmmoLots()
  fetchVaultLocations()
})
</script>

<style scoped>
.armory-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-inputs {
  display: flex;
  gap: 12px;
  flex-grow: 1;
  max-width: 800px;
}

.search-input {
  flex-grow: 2;
}

.filter-select {
  flex-grow: 1;
  max-width: 180px;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  color: var(--text-secondary);
}

.firearms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.gun-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: var(--transition-normal);
  display: flex;
  flex-direction: column;
}

.gun-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-glow);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(204, 164, 59, 0.05);
}

.gun-header-img {
  height: 140px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-bottom: 1px solid var(--border-solid);
}

.gun-action-type {
  position: absolute;
  top: 10px;
  left: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 6px;
  border-radius: 4px;
}

.gun-silhouette {
  color: var(--text-muted);
  width: 140px;
  height: auto;
  opacity: 0.35;
  transition: var(--transition-fast);
}
.gun-card:hover .gun-silhouette {
  color: var(--color-primary);
  opacity: 0.6;
}

.gun-badge-condition {
  position: absolute;
  bottom: 10px;
  right: 12px;
}

.gun-card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-grow: 1;
}

.gun-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.gun-title {
  font-size: 16px;
  font-family: var(--font-heading);
  color: var(--text-primary);
  font-weight: 700;
}

.gun-caliber {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(204, 164, 59, 0.1);
  border: 1px solid rgba(204, 164, 59, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.gun-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.detail-label {
  color: var(--text-secondary);
}

.detail-value {
  color: var(--text-primary);
  font-weight: 500;
}

.text-mono {
  font-family: monospace;
}

.gold-text {
  color: var(--color-primary);
  font-weight: 600;
}

.highlight-text-blue {
  color: var(--color-info);
  font-weight: 600;
}

.tracker-row {
  align-items: center;
  border-top: 1px dashed var(--border-solid);
  padding-top: 8px;
  margin-top: 4px;
}

.tracker-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.highlight-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-accent);
}

.btn-mini {
  padding: 2px 6px;
  font-size: 11px;
}

.gun-card-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border-solid);
}

.btn-small {
  flex: 1;
  padding: 6px 12px;
  font-size: 12px;
}

/* Audiobookshelf Exact Center Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Identical Audiobookshelf dimensions & style rules */
.abs-center-modal {
  width: 920px;
  max-width: 95vw;
  height: 720px;
  max-height: 92vh;
  background-color: var(--bg-modal);
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-lg);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalScaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.modal-title-bar {
  height: 60px;
  border-bottom: 1px solid var(--border-solid);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title-icon {
  font-size: 20px;
}

.modal-title-bar h3 {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-heading);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.modal-close-x-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 26px;
  cursor: pointer;
  padding: 4px;
}
.modal-close-x-btn:hover {
  color: var(--color-danger);
}

/* Horizontal Tabs Row matching ABS styling */
.modal-tabs-header-row {
  display: flex;
  background-color: #17181f; /* Deeper segment for tabs strip */
  border-bottom: 1px solid var(--border-solid);
  padding: 0 16px;
  flex-shrink: 0;
  overflow-x: auto;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 14px 18px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  transition: var(--transition-fast);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--color-primary);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--color-primary);
}

/* Strict fixed-height body content window to prevent modal jumps */
.modal-tabs-body-content {
  flex-grow: 1;
  height: 520px;
  overflow-y: auto;
  padding: 24px;
  background-color: var(--bg-modal);
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.tab-intro {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tab-intro h4 {
  font-size: 14px;
  color: var(--color-primary);
}

.tab-intro p {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Form Grid styles */
.form-grid-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.form-item input, .form-item select, .form-item textarea {
  width: 100%;
}

.full-row {
  grid-column: span 2;
}

.dropdown-select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-field-input {
  border-color: var(--color-accent) !important;
  background-color: rgba(210, 124, 45, 0.04) !important;
}

/* Cover art layouts */
.cover-selection-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-sub-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary);
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.cover-flex-row {
  display: flex;
  gap: 20px;
  align-items: center;
}

.cover-preview-box {
  width: 90px;
  height: 90px;
  background: var(--bg-input);
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.active-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-cover-svg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
}

.no-cover-svg span {
  font-size: 24px;
}

.no-cover-svg p {
  font-size: 10px;
}

.cover-inputs {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-select-row {
  display: flex;
  align-items: center;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
}

.cover-url-row {
  display: flex;
  gap: 10px;
}

.cover-url-row input {
  flex-grow: 1;
}

.field-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.dropdown-divider-line {
  height: 1px;
  background-color: var(--border-solid);
  margin: 8px 0;
}

/* Uploads style sheet */
.uploads-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-controls-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.upload-file-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-input);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-solid);
}

.selected-file-name {
  font-size: 12px;
  color: var(--text-primary);
  font-family: monospace;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-cat-select {
  padding: 10px;
  font-size: 13px;
}

.attachments-list-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.list-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.attachments-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.attachments-table th, .attachments-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-solid);
}

.attachments-table th {
  color: var(--text-secondary);
  font-weight: 600;
  background-color: #17181f;
}

.clickable-attachment-link {
  color: var(--color-primary);
  text-decoration: none;
  font-family: monospace;
}
.clickable-attachment-link:hover {
  text-decoration: underline;
}

.action-cell {
  display: flex;
  gap: 8px;
}

.btn-mini-inline {
  padding: 4px 8px;
  font-size: 10px;
}

.empty-list-placeholder {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  border: 1px dashed var(--border-solid);
  border-radius: var(--radius-sm);
}

/* Accessories custom dynamic insertion list style */
.add-accessory-form-row {
  display: flex;
  gap: 12px;
}

.flex-grow-input {
  flex-grow: 1;
}

.accessories-dynamic-list-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.accessories-scroll-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-sm);
  padding: 12px;
  background-color: #17181f;
}

.accessory-dynamic-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-modal);
  border: 1px solid var(--border-solid);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
}

.card-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bullet-dot {
  font-size: 8px;
  color: var(--color-primary);
}

.accessory-item-text {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}

/* Technical Ammo loads configuration table */
.lots-compact-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.lots-compact-table th, .lots-compact-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-solid);
}

.lots-compact-table th {
  background-color: #17181f;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.05em;
}

.lot-row-notes-tag {
  background-color: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  margin-left: 8px;
  color: var(--text-secondary);
  cursor: help;
}

/* Markdown editor interface styling */
.markdown-editor-pane {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-sm);
  overflow: hidden;
  height: 380px;
}

.markdown-toolbar {
  display: flex;
  background-color: #17181f;
  border-bottom: 1px solid var(--border-solid);
  padding: 6px;
  gap: 4px;
}

.toolbar-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: var(--transition-fast);
}
.toolbar-btn:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.text-format-indicator {
  margin-left: auto;
  font-size: 11px;
  color: var(--color-primary);
  font-weight: 600;
  cursor: default;
}
.text-format-indicator:hover {
  background: transparent;
  color: var(--color-primary);
}

.markdown-split-panel {
  display: flex;
  flex-grow: 1;
  height: calc(100% - 40px);
}

.editor-col {
  width: 50%;
  border-right: 1px solid var(--border-solid);
  height: 100%;
}

.editor-col textarea {
  width: 100%;
  height: 100%;
  background: var(--bg-modal);
  border: none;
  resize: none;
  padding: 16px;
  color: var(--text-primary);
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.5;
}
.editor-col textarea:focus {
  outline: none;
}

.preview-col {
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #15161d;
}

.preview-tag-title {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  flex-shrink: 0;
}

.markdown-rendered-view {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
}

/* Maintenance dynamic task items styling */
.task-insertion-panel {
  background-color: #17181f;
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-sm);
  padding: 14px 18px;
}

.task-form-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.task-item-input-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-item-input-col label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.listings-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.listings-header-row h5 {
  font-size: 13px;
  color: var(--text-secondary);
}

.listings-filter-controls {
  display: flex;
  gap: 8px;
}

.mini-table-filter {
  padding: 6px 10px;
  font-size: 11px;
}

.tasks-master-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.tasks-master-table th, .tasks-master-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-solid);
}

.tasks-master-table th {
  background-color: #17181f;
  color: var(--text-secondary);
}

.task-row-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.tasks-master-table tr.completed .task-text-cell {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* Expandable range shot accordion lists */
.range-history-panel-scroll {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 420px;
  overflow-y: auto;
}

.expandable-accordion-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.accordion-item-box {
  background: #17181f;
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-sm);
  overflow: hidden;
  transition: var(--transition-fast);
}

.accordion-header-trigger {
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
.accordion-header-trigger:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

.trigger-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.expand-icon {
  font-size: 10px;
  color: var(--color-primary);
  width: 12px;
}

.session-date-tag {
  font-size: 13px;
  color: var(--text-primary);
  font-family: monospace;
}

.session-location-tag {
  font-size: 12px;
  color: var(--text-secondary);
}

.accordion-content {
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  padding: 18px;
  background-color: var(--bg-modal);
  animation: slideDownIn 0.15s ease-out;
}

@keyframes slideDownIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.session-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.stat-bubble {
  background: var(--bg-input);
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-sm);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-bubble span {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.stat-bubble strong {
  font-size: 13px;
  color: var(--color-primary);
  font-family: monospace;
}

.session-notes-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg-input);
  border: 1px solid var(--border-solid);
  padding: 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
}

.session-notes-box label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--color-primary);
  font-weight: 700;
  letter-spacing: 0.05em;
}

.session-notes-box p {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-primary);
}

.session-targets-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.session-targets-row label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-weight: 700;
}

.targets-preview-flex {
  display: flex;
  gap: 10px;
}

.target-mock-preview-card {
  background-color: #17181f;
  border: 1px solid var(--border-solid);
  padding: 8px 14px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  font-family: monospace;
  color: var(--color-primary);
  transition: var(--transition-fast);
}
.target-mock-preview-card:hover {
  border-color: var(--color-primary);
  background-color: rgba(204, 164, 59, 0.05);
}

/* Custom alignment overrides */
.align-center-checkbox {
  align-items: flex-start;
  justify-content: center;
  padding-top: 14px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 28px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0;
  height: 18px;
  width: 18px;
  background-color: var(--bg-input);
  border: 1px solid var(--border-solid);
  border-radius: 4px;
}

.checkbox-container:hover input ~ .checkmark {
  border-color: var(--color-primary);
}

.checkbox-container input:checked ~ .checkmark {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid var(--bg-main);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Modal Footer */
.modal-footer-row-container {
  height: 70px;
  border-top: 1px solid var(--border-solid);
  background-color: #17181f;
  padding: 0 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
</style>
