class BackupsList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px;
                }
                .grid-item {
                    border: 1px solid #ccc;
                    padding: 16px;
                    box-sizing: border-box;
                }
                .buttons {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 8px;
                }
                button {
                    padding: 8px;
                    cursor: pointer;
                }
            </style>
            <div class="grid" id="backupsGrid"></div>
        `;
        this.gridElement = this.shadowRoot.getElementById('backupsGrid');
    }

    _emitDetail(action, backup) {
        const detail = { ...backup, action };
        this.dispatchEvent(new CustomEvent('backup-action', { detail }));
    }

    setOptions(options) {
        this.gridElement.innerHTML = '';
        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.innerHTML = `
                <div>Name: ${option.name}</div>
                <div>Label: ${option.label}</div>
                <div>ID: ${option.id}</div>
                <div>Date: ${option.date}</div>
                <div class="buttons">
                    <button data-action="delete">Delete</button>
                    <button data-action="restore">Restore</button>
                    <button data-action="download">Download</button>
                </div>
            `;
            item.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', () => {
                    this._emitDetail(button.getAttribute('data-action'), option);
                });
            });
            this.gridElement.appendChild(item);
        });
    }
}

customElements.define('backups-list', BackupsList);