document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const modelSelector = document.getElementById('model-selector');
    const modelSelectorBtn = document.getElementById('model-selector-btn');
    const currentModelName = document.getElementById('current-model-name');
    const modelList = document.getElementById('model-list');
    const resetChatBtn = document.getElementById('reset-chat-btn');
    const customConfirmModal = document.getElementById('custom-confirm-modal');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    let selectedModel = 'blackbox';
    let chatHistory = [];

    loadHistory();
    initializeModelSelector();

    chatForm.addEventListener('submit', handleFormSubmit);
    resetChatBtn.addEventListener('click', () => {
        customConfirmModal.classList.remove('is-hidden');
    });

    modalCancelBtn.addEventListener('click', () => {
        customConfirmModal.classList.add('is-hidden');
    });

    modalConfirmBtn.addEventListener('click', () => {
        chatHistory = [];
        localStorage.removeItem('lipzxAiChatHistory');
        chatWindow.innerHTML = '';
        renderMessage({ sender: 'ai', content: 'Hello! Please select a model and send a message.', type: 'text' });
        customConfirmModal.classList.add('is-hidden');
    });

    function initializeModelSelector() {
        modelSelectorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modelSelector.classList.toggle('is-open');
        });
        
        modelList.addEventListener('click', (e) => {
            if (e.target.classList.contains('model-item')) {
                selectedModel = e.target.dataset.model;
                currentModelName.textContent = e.target.textContent;
                modelSelector.classList.remove('is-open');
            }
        });

        document.addEventListener('click', () => {
            if (modelSelector.classList.contains('is-open')) {
                modelSelector.classList.remove('is-open');
            }
        });
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        addMessageToHistory(userMessage, 'user', 'text');
        renderMessage({ sender: 'user', content: userMessage, type: 'text' });
        chatInput.value = '';
        showLoadingIndicator();

        const imageKeywords = ['gambar', 'foto', 'buatkan gambar', 'buatkan foto', 'draw', 'create image', 'generate image', 'make a image'];
        const isImageRequest = imageKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));

        if (isImageRequest) {
            await generateImage(userMessage);
        } else {
            await fetchAIResponse(userMessage, selectedModel);
        }
    }
    
    async function fetchAIResponse(prompt, model, isRetry = false) {
        let url = '';
        const encodedPrompt = encodeURIComponent(prompt);

        switch (model) {
            case 'blackbox': url = `https://api.siputzx.my.id/api/ai/blackboxai?content=${encodedPrompt}`; break;
            case 'deepseek': url = `https://api.siputzx.my.id/api/ai/deepseek-llm-67b-chat?content=${encodedPrompt}`; break;
            case 'luminai': url = `https://api.siputzx.my.id/api/ai/luminai?content=${encodedPrompt}`; break;
            case 'llama': url = `https://api.siputzx.my.id/api/ai/llama?prompt=You%20are%20an%20assistant%20that%20always%20responds%20in%20Indonesian%20with%20a%20friendly%20and%20informal%20tone&message=${encodedPrompt}`; break;
            case 'llama33': url = `https://api.siputzx.my.id/api/ai/llama33?prompt=Be%20a%20helpful%20assistant&text=${encodedPrompt}`; break;
            case 'mistral': url = `https://api.siputzx.my.id/api/ai/mistral?prompt=You%20are%20an%20assistant%20that%20always%20responds%20in%20Indonesian%20with%20a%20friendly%20and%20informal%20tone&message=${encodedPrompt}`; break;
            case 'qwq': url = `https://api.siputzx.my.id/api/ai/qwq-32b-preview?content=${encodedPrompt}`; break;
            case 'perplexity': url = `https://api.siputzx.my.id/api/ai/perplexity?text=${encodedPrompt}&model=sonar`; break;
            case 'gpt3':
            case 'gpt4':
                const encodedApiUrl = encodeURIComponent(`https://api.eypz.ct.ws/api/ai/gpt?text=${encodedPrompt}&model=${model}`);
                url = `https://api.allorigins.win/raw?url=${encodedApiUrl}`;
                break;
            default:
                handleError('Invalid model selected.');
                return;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API returned status ${response.status}`);
            
            const data = await response.json();
            if (data.status === false) throw new Error(`API reported an internal error.`);
            
            let aiText = '';
            if (data.response) aiText = data.response;
            else if (data.data && typeof data.data === 'string') aiText = data.data;
            else if (data.data && data.data.output) aiText = data.data.output;
            else aiText = JSON.stringify(data, null, 2);

            addMessageToHistory(aiText, 'ai', 'text');
            renderMessage({ sender: 'ai', content: aiText, type: 'text' });
            removeLoadingIndicator();

        } catch (error) {
            console.error(`API Error for [${model.toUpperCase()}]:`, error.message);
            
            if (!isRetry) {
                await fetchAIResponse(prompt, 'blackbox', true);
            } else {
                handleError('Sorry, our AI models seem to be busy. Please try again later.');
                removeLoadingIndicator();
            }
        }
    }

    async function generateImage(prompt) {
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://api.siputzx.my.id/api/ai/flux?prompt=${encodedPrompt}`;
        
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Image could not be generated.');
            
            const imageBlob = await response.blob();
            const localImageUrl = URL.createObjectURL(imageBlob);

            addMessageToHistory(localImageUrl, 'ai', 'image');
            renderMessage({ sender: 'ai', content: localImageUrl, type: 'image' });

        } catch (error) {
            console.error('Image Generation Error:', error);
            handleError('Sorry, I failed to create the image. The service might be down.');
        } finally {
            removeLoadingIndicator();
        }
    }

    function renderMessage(message) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `chat-message ${message.sender}-message`;

        if (message.type === 'image') {
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'image-wrapper';

            const image = document.createElement('img');
            image.src = message.content;
            image.className = 'message-image';
            
            const downloadBtn = document.createElement('a');
            downloadBtn.href = message.content;
            downloadBtn.download = `lipzx-ai-image-${Date.now()}.png`;
            downloadBtn.className = 'download-btn';
            downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i>';
            
            imageWrapper.appendChild(image);
            imageWrapper.appendChild(downloadBtn);
            messageWrapper.appendChild(imageWrapper);
        } else {
            const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/;
            if (codeBlockRegex.test(message.content) && message.sender === 'ai') {
                const codeMatch = codeBlockRegex.exec(message.content);
                const lang = codeMatch[1] || 'plaintext';
                const code = codeMatch[2].trim();
                
                const codeContainer = document.createElement('div');
                codeContainer.className = 'code-block-container';
                const header = document.createElement('div');
                header.className = 'code-block-header';
                const langSpan = document.createElement('span');
                langSpan.textContent = lang;
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-code-btn';
                copyBtn.textContent = 'Copy';
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(code);
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
                };
                header.appendChild(langSpan);
                header.appendChild(copyBtn);
                
                const pre = document.createElement('pre');
                const codeEl = document.createElement('code');
                codeEl.className = `language-${lang}`;
                codeEl.textContent = code;
                
                pre.appendChild(codeEl);
                codeContainer.appendChild(header);
                codeContainer.appendChild(pre);
                messageWrapper.appendChild(codeContainer);
                hljs.highlightElement(codeEl);
            } else {
                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';
                contentDiv.innerText = message.content;
                messageWrapper.appendChild(contentDiv);
            }
        }
        chatWindow.appendChild(messageWrapper);
        scrollToBottom();
    }
    
    function handleError(errorMessage) {
        addMessageToHistory(errorMessage, 'error', 'text');
        renderMessage({ sender: 'error', content: errorMessage, type: 'text' });
    }

    function showLoadingIndicator() {
        if (document.getElementById('loading-indicator')) return;
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-indicator';
        loadingDiv.className = 'chat-message ai-message';
        loadingDiv.innerHTML = `<div class="message-content loading-dots">Thinking</div>`;
        chatWindow.appendChild(loadingDiv);
        scrollToBottom();
    }

    function removeLoadingIndicator() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.remove();
    }

    function scrollToBottom() {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function addMessageToHistory(content, sender, type) {
        chatHistory.push({ content, sender, type });
        saveHistory();
    }

    function saveHistory() {
        localStorage.setItem('lipzxAiChatHistory', JSON.stringify(chatHistory));
    }

    function loadHistory() {
        const savedHistory = localStorage.getItem('lipzxAiChatHistory');
        chatWindow.innerHTML = '';
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            chatHistory.forEach(message => renderMessage(message));
            if (chatHistory.length === 0) {
                 renderMessage({sender: 'ai', content: 'Hello! What can I do for you today?', type: 'text'});
            }
        } else {
            renderMessage({sender: 'ai', content: 'Hello! Please select a model and send a message.', type: 'text'});
        }
    }
});