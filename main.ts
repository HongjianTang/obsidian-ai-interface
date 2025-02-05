import { App, Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';

interface AIServiceConfig {
    name: string;
    url: string;
    apiKey: string;
    headers: Record<string, string>;
    authType: 'bearer' | 'api-key' | 'custom' | 'none';
    model: string;
    provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral' | 'azure' | 'cohere' | 'qwen' | 'deepseek' | 'perplexity' | 
        'ollama' | 'lmstudio' | 'localai' | 'koboldai' | 'custom';
    isLocal?: boolean;
}

interface AIInterfaceSettings {
    activeService: string;
    services: {
        [key: string]: AIServiceConfig;
    };
    temperature: number;
    maxTokens: number;
}

interface AIRequestOptions {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    systemPrompt?: string;
}

interface AIResponse {
    content: string;
    error?: string;
}

const DEFAULT_SETTINGS: AIInterfaceSettings = {
    activeService: 'default-openai',
    services: {
        'default-openai': {
            name: 'OpenAI Default',
            url: 'https://api.openai.com/v1/chat/completions',
            apiKey: '',
            headers: {},
            authType: 'bearer',
            model: 'gpt-3.5-turbo',
            provider: 'openai'
        }
    },
    temperature: 0.7,
    maxTokens: 2000
};

type ConfigChangeCallback = (settings: AIInterfaceSettings) => void;

export default class AIInterfacePlugin extends Plugin {
    settings: AIInterfaceSettings;
    private configChangeCallbacks: Set<ConfigChangeCallback> = new Set();

    public static maskApiKey(apiKey: string): string {
        if (!apiKey) return '';
        if (apiKey.length <= 8) return apiKey;
        return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
    }

    async onload() {
        await this.loadSettings();
        
        // Add settings tab
        this.addSettingTab(new AIInterfaceSettingTab(this.app, this));
        
        // Register the global API
        (window as any).aiInterfacePlugin = {
            getCurrentConfiguration: () => ({...this.settings}),
            isConfigured: () => this.isConfigured(),
            invokeAI: async (prompt: string, options: Partial<AIRequestOptions> = {}) => {
                return this.invokeAI(prompt, options);
            },
            onConfigurationChange: (callback: ConfigChangeCallback) => {
                this.configChangeCallbacks.add(callback);
                return () => this.configChangeCallbacks.delete(callback);
            }
        };
    }
    
    onunload() {
        delete (window as any).aiInterfacePlugin;
    }

    private isConfigured(): boolean {
        const activeService = this.settings.services[this.settings.activeService];
        // Local providers don't need API key
        if (activeService.isLocal) {
            return true;
        }
        return !!this.settings.activeService && !!activeService.apiKey;
    }

    private notifyConfigChange() {
        this.configChangeCallbacks.forEach(callback => {
            try {
                callback({...this.settings});
            } catch (error) {
                console.error('Error in configuration change callback:', error);
            }
        });
    }

    private formatRequestBody(
        provider: AIServiceConfig['provider'],
        model: string,
        prompt: string,
        systemPrompt: string,
        temperature: number,
        maxTokens: number
    ): any {
        switch (provider) {
            case 'openai':
                return {
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    temperature,
                    max_tokens: maxTokens,
                };
            
            case 'anthropic':
                return {
                    model,
                    messages: [
                        { role: "user", content: prompt },
                    ],
                    system: systemPrompt,
                    max_tokens: maxTokens,
                    temperature,
                };

            case 'google':
                return {
                    contents: [
                        { role: "user", parts: [{ text: prompt }] }
                    ],
                    generationConfig: {
                        temperature,
                        maxOutputTokens: maxTokens,
                    },
                    safetySettings: []
                };

            case 'meta':
                return {
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    temperature,
                    max_tokens: maxTokens,
                };

            case 'mistral':
                return {
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    temperature,
                    max_tokens: maxTokens,
                };

            case 'cohere':
                return {
                    model,
                    prompt,
                    temperature,
                    max_tokens: maxTokens,
                    return_likelihoods: 'NONE',
                };

            case 'qwen':
                return {
                    model,
                    input: {
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: prompt }
                        ]
                    },
                    parameters: {
                        temperature,
                        max_tokens: maxTokens,
                    }
                };

            case 'deepseek':
                return {
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    temperature,
                    max_tokens: maxTokens,
                };

            case 'perplexity':
                return {
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    temperature,
                    max_tokens: maxTokens,
                };

            case 'ollama':
                return {
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    stream: false,
                    options: {
                        temperature,
                        num_predict: maxTokens
                    }
                };

            case 'lmstudio':
                return {
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    temperature,
                    max_tokens: maxTokens,
                };

            case 'localai':
                return {
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    temperature,
                    max_tokens: maxTokens,
                };

            case 'koboldai':
                return {
                    prompt: `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`,
                    max_length: maxTokens,
                    temperature,
                    stop_sequence: ["\nUser:", "\nHuman:"],
                    max_context_length: 4096,
                };

            default:
                // For custom providers, use OpenAI-like format as default
                return {
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    temperature,
                    max_tokens: maxTokens,
                };
        }
    }

    private parseResponse(provider: AIServiceConfig['provider'], data: any): AIResponse {
        try {
            console.log('Parsing response for provider:', provider);
            console.log('Raw response data:', JSON.stringify(data, null, 2));

            switch (provider) {
                case 'openai':
                    return {
                        content: data.choices[0].message.content.trim()
                    };

                case 'anthropic':
                    return {
                        content: data.content[0].text.trim()
                    };

                case 'google':
                    return {
                        content: data.candidates[0].content.parts[0].text.trim()
                    };

                case 'meta':
                case 'mistral':
                case 'deepseek':
                case 'perplexity':
                    return {
                        content: data.choices[0].message.content.trim()
                    };

                case 'cohere':
                    return {
                        content: data.generations[0].text.trim()
                    };

                case 'qwen':
                    return {
                        content: data.output.text.trim()
                    };

                case 'ollama':
                    return {
                        content: data.message?.content?.trim() || data.response?.trim() || ''
                    };

                case 'lmstudio':
                case 'localai':
                    return {
                        content: data.choices[0].message.content.trim()
                    };

                case 'koboldai':
                    return {
                        content: data.results[0].text.trim()
                    };

                case 'custom':
                    console.log('Attempting to parse custom provider response');
                    // Try different common response formats
                    if (data.choices?.[0]?.message?.content) {
                        console.log('Found OpenAI-like response format');
                        return { content: data.choices[0].message.content.trim() };
                    }
                    if (data.output?.text) {
                        console.log('Found output.text format');
                        return { content: data.output.text.trim() };
                    }
                    if (data.response) {
                        console.log('Found direct response format');
                        return { content: data.response.trim() };
                    }
                    if (data.message?.content) {
                        console.log('Found message.content format');
                        return { content: data.message.content.trim() };
                    }
                    if (data.text || data.content) {
                        console.log('Found text/content format');
                        return { content: (data.text || data.content).trim() };
                    }
                    // For OpenRouter specific format
                    if (data.choices?.[0]?.content) {
                        console.log('Found OpenRouter format');
                        return { content: data.choices[0].content.trim() };
                    }
                    // For OpenRouter alternative format
                    if (data.choices?.[0]?.text) {
                        console.log('Found OpenRouter alternative format');
                        return { content: data.choices[0].text.trim() };
                    }

                    console.log('No known response format found');
                    console.log('Available response properties:', Object.keys(data));
                    throw new Error('Unable to parse response format');

                default:
                    // For custom providers, try common response formats
                    if (data.choices?.[0]?.message?.content) {
                        return { content: data.choices[0].message.content.trim() };
                    }
                    if (data.output?.text) {
                        return { content: data.output.text.trim() };
                    }
                    if (data.response) {
                        return { content: data.response.trim() };
                    }
                    throw new Error('Unable to parse response format');
            }
        } catch (error) {
            console.error('Error parsing response:', error);
            console.error('Failed response data:', JSON.stringify(data, null, 2));
            return {
                content: '',
                error: 'Failed to parse response: ' + error.message
            };
        }
    }

    async invokeAI(prompt: string, options: Partial<AIRequestOptions> = {}): Promise<string> {
        console.log('Invoking AI with options:', JSON.stringify(options, null, 2));
        const activeService = this.settings.services[this.settings.activeService];
        console.log('Using service:', JSON.stringify(activeService, null, 2));

        if (!activeService) {
            throw new Error('AI Interface is not properly configured');
        }

        // Only check API key for non-local providers
        if (!activeService.isLocal && !activeService.apiKey) {
            throw new Error('API key is required for this service');
        }

        const {
            temperature = this.settings.temperature,
            maxTokens = this.settings.maxTokens,
            model = activeService.model,
            systemPrompt = "You are a helpful assistant."
        } = options;

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...activeService.headers
            };

            // Set up authentication based on provider and auth type
            if (!activeService.isLocal) {
                switch (activeService.authType) {
                    case 'bearer':
                        headers['Authorization'] = `Bearer ${activeService.apiKey}`;
                        // Special handling for OpenRouter
                        if (activeService.url.includes('openrouter.ai')) {
                            headers['HTTP-Referer'] = 'http://localhost:8080';
                            headers['X-Title'] = 'Obsidian AI Interface';
                        }
                        break;
                    case 'api-key':
                        if (activeService.provider === 'azure') {
                            headers['api-key'] = activeService.apiKey;
                        } else if (activeService.provider === 'google') {
                            headers['x-goog-api-key'] = activeService.apiKey;
                        } else {
                            headers['api-key'] = activeService.apiKey;
                        }
                        break;
                    case 'custom':
                        // Custom headers are already merged above
                        break;
                }
            }

            console.log('Request headers:', JSON.stringify(headers, null, 2));

            // Format request body according to provider
            const body = this.formatRequestBody(
                activeService.provider,
                model,
                prompt,
                systemPrompt,
                temperature,
                maxTokens
            );

            console.log('Request body:', JSON.stringify(body, null, 2));

            const response = await fetch(activeService.url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            console.log('Response status:', response.status);
            if (!response.ok) {
                const error = await response.json().catch(() => null);
                console.error('Error response:', error);
                throw new Error(error?.error?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', JSON.stringify(data, null, 2));

            const result = this.parseResponse(activeService.provider, data);
            
            if (result.error) {
                console.error('Parse error:', result.error);
                throw new Error(result.error);
            }

            console.log('Final parsed result:', result.content);
            return result.content;

        } catch (error) {
            console.error('AI request failed:', error);
            new Notice(`AI Interface Error: ${error.message}`);
            throw error;
        }
    }
    
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    
    async saveSettings() {
        await this.saveData(this.settings);
        this.notifyConfigChange();
    }
}

class AIInterfaceSettingTab extends PluginSettingTab {
    plugin: AIInterfacePlugin;
    
    constructor(app: App, plugin: AIInterfacePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    
    // Helper method to get available models for a provider
    private getModelsForProvider(provider: AIServiceConfig['provider']): Array<{id: string, name: string}> {
        let models: Array<{id: string, name: string}> = [];
        
        switch (provider) {
            case 'openai':
                models = [
                    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
                    { id: 'gpt-4', name: 'GPT-4' },
                    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
                    { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K' }
                ];
                break;
            case 'anthropic':
                models = [
                    { id: 'claude-3-opus', name: 'Claude 3 Opus' },
                    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
                    { id: 'claude-3-haiku', name: 'Claude 3 Haiku' },
                    { id: 'claude-2.1', name: 'Claude 2.1' }
                ];
                break;
            case 'google':
                models = [
                    { id: 'gemini-pro-1.5', name: 'Gemini Pro 1.5' },
                    { id: 'gemini-pro', name: 'Gemini Pro' },
                    { id: 'gemma-7b-it', name: 'Gemma 7B' },
                    { id: 'gemma-2-7b-it', name: 'Gemma 2 7B' }
                ];
                break;
            case 'meta':
                models = [
                    { id: 'llama-3-70b-instruct', name: 'Llama 3 70B Instruct' },
                    { id: 'llama-3-8b-instruct', name: 'Llama 3 8B Instruct' },
                    { id: 'llama-2-70b-chat', name: 'Llama 2 70B Chat' },
                    { id: 'llama-2-13b-chat', name: 'Llama 2 13B Chat' }
                ];
                break;
            case 'mistral':
                models = [
                    { id: 'mistral-large', name: 'Mistral Large' },
                    { id: 'mistral-medium', name: 'Mistral Medium' },
                    { id: 'mistral-small', name: 'Mistral Small' },
                    { id: 'mixtral-8x7b-instruct', name: 'Mixtral 8x7B Instruct' },
                    { id: 'mistral-7b-instruct', name: 'Mistral 7B Instruct' }
                ];
                break;
            case 'cohere':
                models = [
                    { id: 'command-r-plus', name: 'Command R+' },
                    { id: 'command-r', name: 'Command R' },
                    { id: 'command', name: 'Command' }
                ];
                break;
            case 'qwen':
                models = [
                    { id: 'qwen-max', name: 'Qwen Max' },
                    { id: 'qwen-plus', name: 'Qwen Plus' },
                    { id: 'qwen-turbo', name: 'Qwen Turbo' },
                    { id: 'qwen-2-72b-instruct', name: 'Qwen 2 72B Instruct' }
                ];
                break;
            case 'deepseek':
                models = [
                    { id: 'deepseek-chat', name: 'DeepSeek Chat' },
                    { id: 'deepseek-coder', name: 'DeepSeek Coder' }
                ];
                break;
            case 'perplexity':
                models = [
                    { id: 'sonar-medium-online', name: 'Sonar Medium Online' },
                    { id: 'sonar-small-online', name: 'Sonar Small Online' },
                    { id: 'sonar', name: 'Sonar' }
                ];
                break;
            case 'ollama':
                models = [
                    { id: 'llama2', name: 'Llama 2' },
                    { id: 'mistral', name: 'Mistral' },
                    { id: 'mixtral', name: 'Mixtral' },
                    { id: 'codellama', name: 'Code Llama' },
                    { id: 'gemma', name: 'Gemma' },
                    { id: 'neural-chat', name: 'Neural Chat' },
                    { id: 'starling-lm', name: 'Starling' },
                    { id: 'phi', name: 'Phi' },
                    { id: 'qwen', name: 'Qwen' }
                ];
                break;
            case 'lmstudio':
            case 'localai':
            case 'koboldai':
                // Empty array for local providers as they'll use custom model
                models = [];
                break;
            default:
                models = [];
        }

        // Add custom model option for all providers
        models.push({ id: 'custom', name: 'Custom Model' });
        return models;
    }

    // Helper method to get default endpoint for a provider
    private getDefaultEndpoint(provider: AIServiceConfig['provider']): string {
        switch (provider) {
            case 'openai':
                return 'https://api.openai.com/v1/chat/completions';
            case 'anthropic':
                return 'https://api.anthropic.com/v1/messages';
            case 'google':
                return 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
            case 'meta':
                return 'https://llama-api.meta.com/v1/chat/completions';
            case 'mistral':
                return 'https://api.mistral.ai/v1/chat/completions';
            case 'cohere':
                return 'https://api.cohere.ai/v1/generate';
            case 'qwen':
                return 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
            case 'deepseek':
                return 'https://api.deepseek.com/v1/chat/completions';
            case 'perplexity':
                return 'https://api.perplexity.ai/chat/completions';
            case 'ollama':
                return 'http://localhost:11434/api/chat';
            case 'lmstudio':
                return 'http://localhost:1234/v1/chat/completions';
            case 'localai':
                return 'http://localhost:8080/v1/chat/completions';
            case 'koboldai':
                return 'http://localhost:5001/api/v1/generate';
            default:
                return '';
        }
    }

    // Helper method to get default auth type for a provider
    private getDefaultAuthType(provider: AIServiceConfig['provider']): AIServiceConfig['authType'] {
        switch (provider) {
            case 'azure':
                return 'api-key';
            case 'custom':
                return 'custom';
            case 'ollama':
            case 'lmstudio':
            case 'localai':
            case 'koboldai':
                return 'none';
            default:
                return 'bearer';
        }
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();
        
        containerEl.createEl('h2', {text: 'AI Interface Settings'});

        // Service Management
        containerEl.createEl('h3', {text: 'AI Services'});

        // Active Service Selection
        new Setting(containerEl)
            .setName('Active Service')
            .setDesc('Select the AI service to use')
            .addDropdown(dropdown => {
                // Add all available services
                Object.entries(this.plugin.settings.services).forEach(([id, service]) => {
                    dropdown.addOption(id, service.name);
                });
                return dropdown
                    .setValue(this.plugin.settings.activeService)
                    .onChange(async (value) => {
                        this.plugin.settings.activeService = value;
                        await this.plugin.saveSettings();
                        this.display(); // Refresh the settings UI
                    });
            });

        // Add New Service Button
        new Setting(containerEl)
            .setName('Add New Service')
            .setDesc('Add a new AI service configuration')
            .addButton(button => button
                .setButtonText('Add Service')
                .onClick(async () => {
                    const id = `service-${Date.now()}`;
                    this.plugin.settings.services[id] = {
                        name: 'New Service',
                        url: '',
                        apiKey: '',
                        headers: {},
                        authType: 'bearer',
                        model: '',
                        provider: 'custom'
                    };
                    // Automatically select the new service
                    this.plugin.settings.activeService = id;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // Current Service Settings
        const activeService = this.plugin.settings.services[this.plugin.settings.activeService];
        if (activeService) {
            containerEl.createEl('h3', {text: `Settings for ${activeService.name}`});

            // Service Name
            new Setting(containerEl)
                .setName('Service Name')
                .setDesc('Enter a name for this service')
                .addText(text => text
                    .setValue(activeService.name)
                    .onChange(async (value) => {
                        activeService.name = value;
                        await this.plugin.saveSettings();
                    }));

            // Provider Selection
            new Setting(containerEl)
                .setName('Provider')
                .setDesc('Select the service provider')
                .addDropdown(dropdown => {
                    // Cloud Providers
                    dropdown.addOption('openai', 'OpenAI')
                        .addOption('anthropic', 'Anthropic')
                        .addOption('google', 'Google')
                        .addOption('meta', 'Meta')
                        .addOption('mistral', 'Mistral')
                        .addOption('azure', 'Azure OpenAI')
                        .addOption('cohere', 'Cohere')
                        .addOption('qwen', 'Qwen')
                        .addOption('deepseek', 'DeepSeek')
                        .addOption('perplexity', 'Perplexity');

                    // Local Providers
                    dropdown.addOption('ollama', 'Ollama (Local)')
                        .addOption('lmstudio', 'LM Studio (Local)')
                        .addOption('localai', 'LocalAI (Local)')
                        .addOption('koboldai', 'KoboldAI (Local)')
                        .addOption('custom', 'Custom');

                    return dropdown
                        .setValue(activeService.provider)
                        .onChange(async (value: AIServiceConfig['provider']) => {
                            activeService.provider = value;
                            activeService.url = this.getDefaultEndpoint(value);
                            activeService.authType = this.getDefaultAuthType(value);
                            activeService.isLocal = ['ollama', 'lmstudio', 'localai', 'koboldai'].includes(value);
                            await this.plugin.saveSettings();
                            this.display();
                        });
                });

            // API Key (only for non-local providers)
            if (!activeService.isLocal) {
                const apiKeyContainer = containerEl.createDiv();
                const apiKeySetting = new Setting(apiKeyContainer)
                    .setName('API Key')
                    .setDesc('Enter the API key for this service')
                    .addText(text => {
                        const input = text
                            .setPlaceholder('Enter API key')
                            .setValue(activeService.apiKey)
                            .onChange(async (value) => {
                                activeService.apiKey = value;
                                await this.plugin.saveSettings();
                                // Update the masked display after saving
                                apiKeyDisplay.innerText = AIInterfacePlugin.maskApiKey(value);
                            });
                        
                        // Hide the actual input value
                        input.inputEl.type = 'password';
                        
                        return input;
                    });

                // Add masked display of the API key
                const apiKeyDisplay = apiKeyContainer.createDiv();
                apiKeyDisplay.style.marginTop = '6px';
                apiKeyDisplay.style.marginLeft = '15px';
                apiKeyDisplay.style.color = 'var(--text-muted)';
                apiKeyDisplay.innerText = AIInterfacePlugin.maskApiKey(activeService.apiKey);

                // Add show/hide toggle button
                apiKeySetting.addButton(button => button
                    .setIcon('eye')
                    .setTooltip('Show/Hide API Key')
                    .onClick(() => {
                        const input = apiKeySetting.controlEl.querySelector('input');
                        if (input) {
                            if (input.type === 'password') {
                                input.type = 'text';
                                button.setIcon('eye-off');
                            } else {
                                input.type = 'password';
                                button.setIcon('eye');
                            }
                        }
                    }));
            }

            // Port Configuration for Local Providers
            if (activeService.isLocal) {
                new Setting(containerEl)
                    .setName('Port')
                    .setDesc('Configure the port for the local service')
                    .addText(text => {
                        const defaultPorts: Record<string, string> = {
                            'ollama': '11434',
                            'lmstudio': '1234',
                            'localai': '8080',
                            'koboldai': '5001'
                        };
                        const currentPort = activeService.url.match(/:(\d+)/)?.[1] || 
                            defaultPorts[activeService.provider] || '';
                        
                        return text
                            .setPlaceholder('Enter port number')
                            .setValue(currentPort)
                            .onChange(async (value) => {
                                const baseUrl = activeService.url.replace(/:\d+/, '');
                                activeService.url = `${baseUrl}:${value}${activeService.url.split('/').slice(3).join('/')}`;
                                await this.plugin.saveSettings();
                            });
                    });
            }

            // Model Selection
            const modelContainer = containerEl.createDiv();
            new Setting(modelContainer)
                .setName('Model')
                .setDesc('Choose the AI model')
                .addDropdown(dropdown => {
                    const models = this.getModelsForProvider(activeService.provider);
                    models.forEach(model => {
                        dropdown.addOption(model.id, model.name);
                    });

                    return dropdown
                        .setValue(activeService.model || 'custom')
                        .onChange(async (value) => {
                            activeService.model = value;
                            await this.plugin.saveSettings();
                            
                            // Remove existing custom model input if it exists
                            const existingCustomInput = modelContainer.querySelector('.custom-model-input');
                            if (existingCustomInput) {
                                existingCustomInput.remove();
                            }

                            // Show custom model input if custom is selected
                            if (value === 'custom') {
                                const customModelDiv = modelContainer.createDiv();
                                customModelDiv.className = 'custom-model-input';
                                customModelDiv.style.marginTop = '6px';
                                
                                new Setting(customModelDiv)
                                    .setName('Custom Model')
                                    .setDesc('Enter the model identifier')
                                    .addText(text => text
                                        .setPlaceholder('Enter model name/identifier')
                                        .setValue(activeService.model === 'custom' ? '' : activeService.model)
                                        .onChange(async (customValue) => {
                                            activeService.model = customValue;
                                            await this.plugin.saveSettings();
                                        }));
                            }
                        });
                });

            // If custom model is selected, show the input field immediately
            if (activeService.model === 'custom' || !activeService.model) {
                const customModelDiv = modelContainer.createDiv();
                customModelDiv.className = 'custom-model-input';
                customModelDiv.style.marginTop = '6px';
                
                new Setting(customModelDiv)
                    .setName('Custom Model')
                    .setDesc('Enter the model identifier')
                    .addText(text => text
                        .setPlaceholder('Enter model name/identifier')
                        .setValue(activeService.model === 'custom' ? '' : activeService.model)
                        .onChange(async (customValue) => {
                            activeService.model = customValue;
                            await this.plugin.saveSettings();
                        }));
            }

            // Endpoint URL for Custom Provider
            if (activeService.provider === 'custom') {
                new Setting(containerEl)
                    .setName('Endpoint URL')
                    .setDesc('Enter the API endpoint URL')
                    .addText(text => text
                        .setPlaceholder('https://api.example.com/v1/chat/completions')
                        .setValue(activeService.url)
                        .onChange(async (value) => {
                            activeService.url = value;
                            await this.plugin.saveSettings();
                        }));

                // Authentication Type
                new Setting(containerEl)
                    .setName('Authentication Type')
                    .setDesc('Select how to authenticate with this service')
                    .addDropdown(dropdown => dropdown
                        .addOption('bearer', 'Bearer Token')
                        .addOption('api-key', 'API Key')
                        .addOption('custom', 'Custom Headers')
                        .setValue(activeService.authType)
                        .onChange(async (value: AIServiceConfig['authType']) => {
                            activeService.authType = value;
                            await this.plugin.saveSettings();
                        }));
            }

            // Delete Service Button (don't allow deleting the last service)
            if (Object.keys(this.plugin.settings.services).length > 1) {
                new Setting(containerEl)
                    .setName('Delete Service')
                    .setDesc('Remove this service configuration')
                    .addButton(button => button
                        .setButtonText('Delete')
                        .setWarning()
                        .onClick(async () => {
                            const serviceId = this.plugin.settings.activeService;
                            delete this.plugin.settings.services[serviceId];
                            this.plugin.settings.activeService = Object.keys(this.plugin.settings.services)[0];
                            await this.plugin.saveSettings();
                            this.display();
                        }));
            }
        }

        // Advanced Settings
        containerEl.createEl('h3', {text: 'Advanced Settings'});

        new Setting(containerEl)
            .setName('Temperature')
            .setDesc('Controls randomness in the output (0-1)')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.plugin.settings.temperature)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.temperature = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Max Tokens')
            .setDesc('Maximum length of the response')
            .addText(text => text
                .setValue(String(this.plugin.settings.maxTokens))
                .onChange(async (value) => {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue > 0) {
                        this.plugin.settings.maxTokens = numValue;
                        await this.plugin.saveSettings();
                    }
                }));
    }
} 