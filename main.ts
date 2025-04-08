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
    timeout: number;
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

interface AIInterfaceAPI {
    getCurrentConfiguration: () => AIInterfaceSettings;
    isConfigured: () => boolean;
    invokeAI: (prompt: string, options?: Partial<AIRequestOptions>) => Promise<string>;
    onConfigurationChange: (callback: ConfigChangeCallback) => () => void;
}

declare global {
    interface Window {
        aiInterfacePlugin?: AIInterfaceAPI;
    }
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
            model: 'gpt-4-turbo',
            provider: 'openai'
        }
    },
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 10000
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
        window.aiInterfacePlugin = {
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
        delete window.aiInterfacePlugin;
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
                    // Try different common response formats
                    if (data.choices?.[0]?.message?.content) {
                        return { content: data.choices[0].message.content.trim() };
                    }
                    if (data.output?.text) {
                        return { content: data.output.text.trim() };
                    }
                    if (data.response) {
                        return { content: data.response.trim() };
                    }
                    if (data.message?.content) {
                        return { content: data.message.content.trim() };
                    }
                    if (data.text || data.content) {
                        return { content: (data.text || data.content).trim() };
                    }
                    if (data.choices?.[0]?.content) {
                        return { content: data.choices[0].content.trim() };
                    }
                    if (data.choices?.[0]?.text) {
                        return { content: data.choices[0].text.trim() };
                    }

                    console.error('No known response format found. Response keys:', Object.keys(data));
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
            console.error('Response parsing error:', error.message);
            return {
                content: '',
                error: 'Failed to parse response: ' + error.message
            };
        }
    }

    async invokeAI(prompt: string, options: Partial<AIRequestOptions> = {}): Promise<string> {
        let activeService = this.settings.services[this.settings.activeService];

        // If a specific model is requested and the current service doesn't have it,
        // try to find another service that has this model
        if (options.model && options.model !== activeService.model) {
            const serviceWithModel = Object.entries(this.settings.services).find(([_, service]) => 
                service.model === options.model
            );

            if (serviceWithModel) {
                console.log('Using alternative service for model:', options.model);
                activeService = serviceWithModel[1];
            }
        }

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
                }
            }

            const body = this.formatRequestBody(
                activeService.provider,
                model,
                prompt,
                systemPrompt,
                temperature,
                maxTokens
            );

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.settings.timeout);

            try {
                const response = await fetch(activeService.url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const error = await response.json().catch(() => null);
                    console.error('API Error:', error?.error?.message || response.status);
                    throw new Error(error?.error?.message || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const result = this.parseResponse(activeService.provider, data);
                
                if (result.error) {
                    throw new Error(result.error);
                }

                return result.content;

            } catch (error) {
                if (error.name === 'AbortError') {
                    throw new Error(`Request timed out after ${this.settings.timeout / 1000} seconds`);
                }
                throw error;
            }

        } catch (error) {
            console.error('AI request failed:', error.message);
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
                    { id: 'gpt-4o', name: 'GPT-4O' },
                    { id: 'gpt-4o-mini', name: 'GPT-4O Mini' },
                    { id: 'o1-mini', name: 'O1 Mini' },
                    { id: 'o1-preview', name: 'O1 Preview' },
                    { id: 'o1', name: 'O1' },
                    { id: 'o3-mini', name: 'O3 Mini' },
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
        
        containerEl.createEl('h2', {text: 'Ai interface settings'});

        // Service Management
        containerEl.createEl('h3', {text: 'Ai services'});

        // Active Service Selection
        new Setting(containerEl)
            .setName('Active service')
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
            .setName('Add new service')
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
                .setName('Service name')
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
                const apiKeyContainer = containerEl.createDiv({ cls: 'ai-interface-api-key-container' });
                
                // Add the input setting
                const apiKeySetting = new Setting(apiKeyContainer)
                    .setName('Api key')
                    .setDesc('Enter the API key for this service')
                    .addText(text => {
                        const input = text
                            .setPlaceholder('Enter API key')
                            .setValue(activeService.apiKey)
                            .onChange(async (value) => {
                                activeService.apiKey = value;
                                await this.plugin.saveSettings();
                                // Update the masked display
                                maskedKeySetting.setDesc(AIInterfacePlugin.maskApiKey(value));
                            });
                        
                        // Hide the actual input value
                        input.inputEl.type = 'password';
                        
                        return input;
                    })
                    .addButton(button => button
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

                // Add masked key display in a separate line
                const maskedKeySetting = new Setting(apiKeyContainer)
                    .setName('')
                    .setDesc(AIInterfacePlugin.maskApiKey(activeService.apiKey));
                
                // Apply CSS classes
                maskedKeySetting.descEl.addClass('ai-interface-masked-key');
                maskedKeySetting.settingEl.addClass('ai-interface-masked-key-setting');
                maskedKeySetting.controlEl.hide();
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
            const modelContainer = containerEl.createDiv({ cls: 'ai-interface-model-container' });
            new Setting(modelContainer)
                .setName('Model')
                .setDesc('Choose the AI model')
                .addDropdown(dropdown => {
                    const models = this.getModelsForProvider(activeService.provider);
                    const modelIds = models.map(m => m.id);
                    
                    // If current model is not in the list, it's a custom model
                    const isCustomModel = activeService.model && !modelIds.includes(activeService.model);
                    
                    models.forEach(model => {
                        dropdown.addOption(model.id, model.name);
                    });

                    return dropdown
                        .setValue(isCustomModel ? 'custom' : (activeService.model || 'custom'))
                        .onChange(async (value) => {
                            if (value !== 'custom') {
                                activeService.model = value;
                            }
                            await this.plugin.saveSettings();
                            
                            // Remove existing custom model input if it exists
                            const existingCustomInput = modelContainer.querySelector('.ai-interface-custom-model');
                            if (existingCustomInput) {
                                existingCustomInput.remove();
                            }

                            // Show custom model input if custom is selected
                            if (value === 'custom') {
                                const customModelDiv = modelContainer.createDiv({ cls: 'ai-interface-custom-model' });
                                
                                new Setting(customModelDiv)
                                    .setName('Custom model')
                                    .setDesc('Enter the model identifier')
                                    .addText(text => text
                                        .setPlaceholder('Enter model name/identifier')
                                        .setValue(isCustomModel ? activeService.model : '')
                                        .onChange(async (customValue) => {
                                            activeService.model = customValue;
                                            await this.plugin.saveSettings();
                                        }));
                            }
                        });
                });

            // If custom model is selected or current model is not in the predefined list, show the input field
            const models = this.getModelsForProvider(activeService.provider);
            const modelIds = models.map(m => m.id);
            const isCustomModel = activeService.model && !modelIds.includes(activeService.model);
            
            if (activeService.model === 'custom' || !activeService.model || isCustomModel) {
                const customModelDiv = modelContainer.createDiv({ cls: 'ai-interface-custom-model' });
                
                new Setting(customModelDiv)
                    .setName('Custom model')
                    .setDesc('Enter the model identifier')
                    .addText(text => text
                        .setPlaceholder('Enter model name/identifier')
                        .setValue(isCustomModel ? activeService.model : '')
                        .onChange(async (customValue) => {
                            activeService.model = customValue;
                            await this.plugin.saveSettings();
                        }));
            }

            // Endpoint URL for Custom Provider
            if (activeService.provider === 'custom') {
                new Setting(containerEl)
                    .setName('Endpoint url')
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
                    .setName('Authentication type')
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
                    .setName('Delete service')
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
        containerEl.createEl('h3', {
            text: 'Advanced settings',
            cls: 'ai-interface-section-header'
        });

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
            .setName('Max tokens')
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

        new Setting(containerEl)
            .setName('Request timeout')
            .setDesc('Maximum time to wait for AI response (in seconds)')
            .addText(text => text
                .setValue(String(this.plugin.settings.timeout / 1000))
                .onChange(async (value) => {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue > 0) {
                        this.plugin.settings.timeout = numValue * 1000; // Convert to milliseconds
                        await this.plugin.saveSettings();
                    }
                }));
    }
} 