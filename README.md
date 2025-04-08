# Obsidian AI Interface Plugin :bulb: :books:

![GitHub release (latest by date)](https://img.shields.io/github/v/release/HongjianTang/obsidian-ai-interface?style=for-the-badge)
![GitHub all releases](https://img.shields.io/github/downloads/HongjianTang/obsidian-ai-interface/total?style=for-the-badge)

## Tired of Repeating AI Configurations?

Are you tired of setting up models and API keys in every single plugin?

Are you a developer annoyed by having to build and update a separate system for each plugin—keeping track of model lists, local setups, and custom endpoints?

If so, check out AI Interface. It's a one-stop solution that simplifies all your AI/LLM settings for Obsidian.

## What It Does

- **One Plugin, One Configuration**: Set everything up in a single plugin, one single truth.

- **Unified Settings for All Plugins**: No more repetitive setups—once you've configured AI Interface, all other plugins will use the same settings.

- **Flexible Integration**: Support for custom endpoints, local LLMs, and the ability to auto adjust request and response formats based on the model.

- **Safe and Simple**: Your API keys and sensitive data are securely encrypted, and the interface is designed to be easy to use.

### Screenshot

![image](https://github.com/user-attachments/assets/8f08f513-4c07-4e53-9946-6174cd8a65cc)

## Installation

### From Obsidian Community Plugins

PS: It's still under review, so you need to install it manually for now.

1. Open Obsidian Settings
2. Navigate to "Community plugins" and click "Browse"
3. Search for "AI Interface" and click Install
4. Enable the plugin in Community plugins
5. Set up your API key in plugin settings
6. Restart Obsidian

### Manual Installation

1. Download the latest release from the [Releases](https://github.com/HongjianTang/obsidian-ai-interface/releases) page
2. Unzip the file and rename the folder to "ai-interface"
3. Copy the "ai-interface" folder to your Obsidian plugins folder
4. Enable the plugin in Obsidian settings
5. Set up your API key in plugin settings
6. Restart Obsidian

## Usage

- Click "Add service" to add a new service, the new service will be auto selected as the active service
- Rename service to your desired name
- Change the provider, api key, model, etc.
- It would auto save the changes
- If you want to change the active service, you can click the dropdown menu to select the new active service

## Developer API

Other plugins can take advantage of the AI Interface Plugin's centralized configuration and functionality. Below is a summary of the available API.

### Type Definitions

```typescript
interface AIRequestOptions {
    temperature?: number;    // Controls randomness (0-1)
    maxTokens?: number;      // Maximum length of response
    model?: string;         // Specific model to use
    systemPrompt?: string;  // System prompt for the AI
}

interface AIServiceConfig {
    name: string;
    url: string;
    apiKey: string;
    headers: Record<string, string>;
    authType: 'bearer' | 'api-key' | 'custom' | 'none';
    model: string;
    provider: string;
    isLocal?: boolean;
}

interface AIInterfaceSettings {
    activeService: string;
    services: Record<string, AIServiceConfig>;
    temperature: number;
    maxTokens: number;
    timeout: number;
}

interface AIInterfaceAPI {
    getCurrentConfiguration: () => AIInterfaceSettings;
    isConfigured: () => boolean;
    invokeAI: (prompt: string, options?: Partial<AIRequestOptions>) => Promise<string>;
    onConfigurationChange: (callback: (settings: AIInterfaceSettings) => void) => () => void;
}

// Declare the global API
declare global {
    interface Window {
        aiInterfacePlugin?: AIInterfaceAPI;
    }
}
```

### Usage Examples

1. **Basic Usage**
```typescript
class YourPlugin extends Plugin {
    async onload() {
        // Check if AI Interface is available
        if (!window.aiInterfacePlugin) {
            new Notice('AI Interface plugin is required');
            return;
        }

        // Simple AI invocation
        try {
            const response = await window.aiInterfacePlugin.invokeAI(
                "What is the capital of France?",
                {
                    temperature: 0.7,
                    maxTokens: 100
                }
            );
            console.log('AI response:', response);
        } catch (error) {
            console.error('AI request failed:', error);
        }
    }
}
```

2. **Advanced Usage with Configuration Monitoring**
```typescript
class AdvancedPlugin extends Plugin {
    private unsubscribeConfig: () => void;

    async onload() {
        const ai = window.aiInterfacePlugin;
        if (!ai) {
            new Notice('AI Interface plugin is required');
            return;
        }

        // Get current configuration
        const config = ai.getCurrentConfiguration();
        console.log('Current active service:', config.services[config.activeService]);

        // Monitor configuration changes
        this.unsubscribeConfig = ai.onConfigurationChange((newConfig) => {
            console.log('AI configuration changed:', newConfig);
            // Handle configuration changes...
        });

        // Add command for AI interaction
        this.addCommand({
            id: 'analyze-text',
            name: 'Analyze Text',
            callback: async () => {
                if (!ai.isConfigured()) {
                    new Notice('Please configure AI Interface first');
                    return;
                }

                try {
                    const response = await ai.invokeAI(
                        "Analyze this text",
                        {
                            temperature: 0.3,
                            maxTokens: 500,
                            systemPrompt: "You are an analytical assistant."
                        }
                    );
                    new Notice('Analysis complete');
                } catch (error) {
                    new Notice('Analysis failed: ' + error.message);
                }
            }
        });

        // Clean up on unload
        this.register(() => this.unsubscribeConfig());
    }
}
```

3. **Editor Integration Example**
```typescript
class EditorPlugin extends Plugin {
    async onload() {
        const ai = window.aiInterfacePlugin;
        if (!ai) return;

        // Add command for context-aware AI assistance
        this.addCommand({
            id: 'analyze-current-note',
            name: 'Analyze Current Note',
            editorCallback: async (editor, view) => {
                const currentText = editor.getValue();
                
                try {
                    const analysis = await ai.invokeAI(
                        `Analyze the following text:\n${currentText}`,
                        {
                            temperature: 0.5,
                            maxTokens: 1000,
                            systemPrompt: "You are an expert in text analysis."
                        }
                    );
                    
                    // Insert analysis at cursor position
                    const cursor = editor.getCursor();
                    editor.replaceRange('\n\nAI Analysis:\n' + analysis, cursor);
                } catch (error) {
                    new Notice('Analysis failed: ' + error.message);
                }
            }
        });
    }
}
```

4. **Using Specific Models**
```typescript
class ModelSpecificPlugin extends Plugin {
    async onload() {
        const ai = window.aiInterfacePlugin;
        if (!ai) return;

        // Use a specific model
        this.addCommand({
            id: 'use-specific-model',
            name: 'Use Specific Model',
            callback: async () => {
                try {
                    const response = await ai.invokeAI(
                        "Explain quantum computing",
                        {
                            model: "gpt-4-turbo",  // Specify model
                            temperature: 0.7,
                            maxTokens: 1000
                        }
                    );
                    new Notice('Response received');
                } catch (error) {
                    new Notice('Request failed: ' + error.message);
                }
            }
        });
    }
}
```

### Best Practices

1. **Always check for plugin availability**
```typescript
if (!window.aiInterfacePlugin) {
    new Notice('AI Interface plugin is required');
    return;
}
```

2. **Handle configuration changes**
```typescript
const unsubscribe = ai.onConfigurationChange((newConfig) => {
    // Update your plugin's state based on new configuration
});
this.register(() => unsubscribe()); // Clean up on unload
```

3. **Error handling**
```typescript
try {
    const response = await ai.invokeAI("Your prompt");
} catch (error) {
    new Notice('AI request failed: ' + error.message);
}
```

4. **Check configuration status**
```typescript
if (!ai.isConfigured()) {
    new Notice('Please configure AI Interface first');
    return;
}
```

## Roadmap

- [ ] Encrypt API keys in the settings file

## Contributing

We welcome contributions from the community!

## License

This project is licensed under the MIT License.

---

*Leverage AI capabilities in your Obsidian workflow effortlessly—configure once, and let your plugins do the rest!*
