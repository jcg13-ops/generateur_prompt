class PromptGenerator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadSavedPrompts();
    }

    initializeElements() {
        this.form = document.getElementById('promptForm');
        this.preview = document.getElementById('promptPreview');
        this.charCount = document.getElementById('charCount');
        this.wordCount = document.getElementById('wordCount');
        this.qualityScore = document.getElementById('qualityScore');
        this.copyBtn = document.getElementById('copyBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
    }

    bindEvents() {
        // Mise à jour en temps réel
        this.form.addEventListener('input', () => this.updatePreview());
        this.form.addEventListener('change', () => this.updatePreview());

        // Boutons d'action
        this.copyBtn.addEventListener('click', () => this.copyPrompt());
        this.saveBtn.addEventListener('click', () => this.savePrompt());
        this.clearBtn.addEventListener('click', () => this.clearForm());

        // Suggestions cliquables
        document.querySelectorAll('.suggestion-tag').forEach(tag => {
            tag.addEventListener('click', (e) => this.applySuggestion(e));
        });
    }

    applySuggestion(e) {
        const tag = e.target;
        const fieldName = tag.dataset.field;
        const value = tag.textContent;
        const field = document.getElementById(fieldName);
        
        if (field) {
            if (field.value) {
                field.value += field.tagName === 'TEXTAREA' ? '\n' + value : ', ' + value;
            } else {
                field.value = value;
            }
            this.updatePreview();
        }
    }

    updatePreview() {
        const formData = this.getFormData();
        const prompt = this.generatePrompt(formData);
        
        this.preview.textContent = prompt || 'Remplissez les champs pour voir l\'aperçu du prompt généré...';
        
        // Mise à jour des statistiques
        const charCount = prompt.length;
        const wordCount = prompt.split(/\s+/).filter(word => word.length > 0).length;
        const qualityScore = this.calculateQualityScore(formData);
        
        this.charCount.textContent = charCount;
        this.wordCount.textContent = wordCount;
        this.qualityScore.textContent = qualityScore + '%';
    }

    getFormData() {
        return {
            role: document.getElementById('role').value,
            context: document.getElementById('context').value,
            task: document.getElementById('task').value,
            constraints: document.getElementById('constraints').value,
            tone: document.getElementById('tone').value,
            format: document.getElementById('format').value
        };
    }

    generatePrompt(data) {
        let prompt = '';
        
        if (data.role) {
            prompt += `Tu es ${data.role}.\n\n`;
        }
        
        if (data.context) {
            prompt += `contexte:\n${data.context}\n\n`;
        }
        
        if (data.task) {
            prompt += `tâche:\n${data.task}\n\n`;
        }
        
        if (data.constraints) {
            prompt += `contraintes:\n${data.constraints}\n\n`;
        }
        
        if (data.tone || data.format) {
            prompt += `instructions:\n`;
            if (data.tone) {
                prompt += `- Adopte un ton ${data.tone}\n`;
            }
            if (data.format) {
                prompt += `- Présente la réponse sous forme ${data.format}\n`;
            }
            prompt += '\n';
        }
        
        return prompt.trim();
    }

    calculateQualityScore(data) {
        let score = 0;
        const fields = ['role', 'context', 'task', 'tone', 'format'];
        
        fields.forEach(field => {
            if (data[field] && data[field].trim()) {
                score += 20;
            }
        });
        
        // Bonus pour les contraintes
        if (data.constraints && data.constraints.trim()) score += 10;
        
        return Math.min(100, score);
    }

    copyPrompt() {
        const prompt = this.preview.textContent;
        if (prompt && prompt !== 'Remplissez les champs pour voir l\'aperçu du prompt généré...') {
            navigator.clipboard.writeText(prompt).then(() => {
                this.showToast('Prompt copié dans le presse-papier!');
            }).catch(() => {
                this.showToast('Erreur lors de la copie', 'error');
            });
        } else {
            this.showToast('Aucun prompt à copier', 'warning');
        }
    }

    savePrompt() {
        const formData = this.getFormData();
        const prompt = this.generatePrompt(formData);
        
        if (!prompt) {
            this.showToast('Aucun prompt à sauvegarder', 'warning');
            return;
        }

        const savedPrompts = JSON.parse(localStorage.getItem('savedPrompts') || '[]');
        const newPrompt = {
            id: Date.now(),
            name: formData.task ? formData.task.substring(0, 50) + '...' : 'Prompt sans nom',
            prompt: prompt,
            createdAt: new Date().toLocaleDateString()
        };

        savedPrompts.push(newPrompt);
        localStorage.setItem('savedPrompts', JSON.stringify(savedPrompts));
        
        this.loadSavedPrompts();
        this.showToast('Prompt sauvegardé avec succès!');
    }

    loadSavedPrompts() {
        const savedPrompts = JSON.parse(localStorage.getItem('savedPrompts') || '[]');
        const container = document.getElementById('savedPromptsList');
        
        if (savedPrompts.length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">Aucun prompt sauvegardé</p>';
            return;
        }

        container.innerHTML = savedPrompts.map(prompt => `
            <div class="saved-prompt-item">
                <div>
                    <strong>${prompt.name}</strong>
                    <small>${prompt.createdAt}</small>
                </div>
                <div>
                    <button class="btn btn-secondary" style="margin-right: 10px; padding: 8px 16px; font-size: 14px;" onclick="promptGenerator.loadPrompt(${prompt.id})">
                        Charger
                    </button>
                    <button class="btn" style="background: #dc3545; color: white; padding: 8px 12px; font-size: 14px;" onclick="promptGenerator.deletePrompt(${prompt.id})">
                        ×
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadPrompt(id) {
        const savedPrompts = JSON.parse(localStorage.getItem('savedPrompts') || '[]');
        const prompt = savedPrompts.find(p => p.id === id);
        
        if (prompt) {
            this.preview.textContent = prompt.prompt;
            this.showToast('Prompt chargé!');
        }
    }

    deletePrompt(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce prompt ?')) {
            const savedPrompts = JSON.parse(localStorage.getItem('savedPrompts') || '[]');
            const filteredPrompts = savedPrompts.filter(p => p.id !== id);
            localStorage.setItem('savedPrompts', JSON.stringify(filteredPrompts));
            this.loadSavedPrompts();
            this.showToast('Prompt supprimé');
        }
    }

    clearForm() {
        if (confirm('Êtes-vous sûr de vouloir effacer tous les champs ?')) {
            this.form.reset();
            this.updatePreview();
            this.showToast('Formulaire effacé');
        }
    }

    showToast(message, type = 'success') {
        this.toastMessage.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Initialisation
const promptGenerator = new PromptGenerator();
