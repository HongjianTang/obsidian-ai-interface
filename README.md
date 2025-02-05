# AI Interface Plugin for Obsidian

The **AI Interface Plugin for Obsidian** provides a centralized, flexible, and secure way to configure and manage AI/LLM services within Obsidian. It allows users to set up API keys, choose models, and even configure custom endpoints for services such as OpenRouter, Azure, or self-hosted models. Additionally, it exposes a robust API so that other plugins can seamlessly leverage its AI capabilities without requiring redundant configurations.

---

## Features

- **Centralized AI Configuration**:
    
    Configure API keys, select models, and set custom endpoints (e.g., OpenRouter, Azure, or local LLM) in one place.
    
- **Custom Endpoint Flexibility**:
    
    Users can specify custom endpoints for various AI services, allowing for integration with multiple providers beyond the default options.
    
- **Exposed API for Extensibility**:
    
    Other plugins can access AI features through a defined API. This means once you configure your AI/LLM settings, any compatible plugin can leverage these settings without requiring its own configuration.
    
- **Secure Credential Management**:
    
    Sensitive information like API keys is securely stored using encryption to ensure your data remains protected.
    
- **User-Friendly Interface**:
    
    Designed to align with Obsidian's UI/UX, making it easy for both novice and advanced users to configure and manage AI settings.
    

---

## Installation

1. **Download or Clone** the plugin repository.
2. **Copy** the plugin files into your Obsidian plugins directory.
3. **Enable** the plugin from Obsidian's settings under `Community Plugins`.
4. **Restart** Obsidian if necessary to ensure proper loading of the plugin.

---

## Configuration

1. **Open the Plugin Settings Panel**:
    
    In Obsidian, navigate to the plugin settings to begin configuration.
    
2. **Input Your Credentials**:
    - Enter your API key.
    - Choose your AI model (e.g., GPT-3, GPT-4, or a custom model).
3. **Set Custom Endpoints** (if applicable):
    - For providers like **OpenRouter** or **Azure**, input the custom endpoint URL and any additional authentication parameters.
    - For local/self-hosted models, specify the local endpoint details.
4. **Save** your configuration.
    
    The plugin securely stores these settings, allowing other plugins to access this centralized configuration.
    

### Custom Endpoint Support

The plugin supports any AI endpoint that conforms to the expected API specification. This means you can configure:

- **OpenRouter**: Use your endpoint URL and credentials.
- **Azure**: Specify the Azure endpoint along with model-specific details.
- **Local LLM**: Point to your self-hosted or locally running AI model.

---

## Developer API

Other plugins can take advantage of the AI Interface Plugin's centralized configuration and functionality. Below is a summary of the available API.

### API Methods

- **`getCurrentConfiguration()`**
    
    *Returns the current AI/LLM configuration including API key, model, endpoint, and additional parameters.*
    
- **`invokeAI(prompt: string, options: object): Promise<Response>`**
    
    *Sends a prompt to the configured AI model and returns a promise that resolves with the AI response.*
    
- **`onConfigurationChange(callback: Function)`**
    
    *Registers a callback function that is triggered whenever the AI/LLM configuration changes.*
    
- **`isConfigured(): boolean`**
    
    *Returns a boolean indicating whether a valid AI/LLM configuration is present.*
    

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

---

## Documentation & Support

- **API Documentation**: Detailed API docs can be found in the [docs/API.md](https://chatgpt.com/c/docs/API.md) file.
- **Community Support**: Join our community on [Discord](https://discord.example.com/) or visit our [forum](https://forum.example.com/) for help and discussions.
- **Bug Reports & Feature Requests**: Report issues or request features via our [GitHub Issues](https://github.com/yourrepo/ai-interface-plugin/issues).

---

## Contributing

We welcome contributions from the community! Please see our [CONTRIBUTING.md](https://chatgpt.com/c/CONTRIBUTING.md) file for guidelines on how to contribute to this project.

---

## License

This project is licensed under the [MIT License](https://chatgpt.com/c/LICENSE).

---

## Acknowledgements

Special thanks to all contributors and users who have provided valuable feedback during the development of this plugin.

---

*Leverage AI capabilities in your Obsidian workflow effortlessly—configure once, and let your plugins do the rest!*