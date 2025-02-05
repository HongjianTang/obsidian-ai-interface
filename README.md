# Obsidian AI Interface Plugin :bulb: :books:

![GitHub release (latest by date)](https://img.shields.io/github/v/release/HongjianTang/obsidian-ai-interface?style=for-the-badge)
![GitHub all releases](https://img.shields.io/github/downloads/HongjianTang/obsidian-ai-interface/total?style=for-the-badge)

## Tired of Repeating AI Configurations?

Are you tired of setting up models and API keys in every single plugin?

Are you a developer annoyed by having to build and update a separate system for each plugin—keeping track of model lists, local setups, and custom endpoints?

If so, check out AI Interface. It’s a one-stop solution that simplifies all your AI/LLM settings for Obsidian.

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

## Developer API

Other plugins can take advantage of the AI Interface Plugin's centralized configuration and functionality. Below is a summary of the available API.

### API Methods

- **`invokeAI(prompt: string, options: object): Promise<Response>`**
    
    *Sends a prompt to the configured AI model and returns a promise that resolves with the AI response.*

- **`getCurrentConfiguration()`**
    
    *Returns the current AI/LLM configuration including API key, model, endpoint, and additional parameters.*
    
- **`isConfigured(): boolean`**
    
    *Returns a boolean indicating whether a valid AI/LLM configuration is present.*

- **`onConfigurationChange(callback: Function)`**
    
    *Registers a callback function that is triggered whenever the AI/LLM configuration changes.*

### Example Integration

Other plugins can integrate with the AI Interface Plugin using the global API object (e.g., `window.aiInterfacePlugin`):

```jsx
// Example usage in another plugin
interface AIRequestOptions {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    systemPrompt?: string;
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
    services: {
        [key: string]: AIServiceConfig;
    };
    temperature: number;
    maxTokens: number;
}

// Example 1: Basic Plugin Integration
class BasicAIPlugin extends Plugin {
    async onload() {
        // Get AI Interface plugin instance
        const aiInterface = (window as any).aiInterfacePlugin;
        
        if (!aiInterface) {
            new Notice('AI Interface plugin is required');
            return;
        }

        // Check if configured
        if (!aiInterface.isConfigured()) {
            new Notice('Please configure AI Interface first');
            return;
        }

        // Simple AI invocation
        try {
            const response = await aiInterface.invokeAI(
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

## Contributing

We welcome contributions from the community!

## License

This project is licensed under the MIT License.

---

*Leverage AI capabilities in your Obsidian workflow effortlessly—configure once, and let your plugins do the rest!*
