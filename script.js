// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const photoInput = document.getElementById('photoInput');
const previewArea = document.getElementById('previewArea');
const previewImage = document.getElementById('previewImage');
const removeBtn = document.getElementById('removeBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsPanel = document.getElementById('resultsPanel');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');

// Nutrition value elements
const caloriesEl = document.getElementById('calories');
const proteinEl = document.getElementById('protein');
const carbsEl = document.getElementById('carbs');
const fatEl = document.getElementById('fat');

// State
let selectedFile = null;
let currentLanguage = 'zh'; // Default to Chinese

// Language translations
const translations = {
    zh: {
        // Units and dynamic text
        unit_grams: '克',
        analyzing_progress: 'AI分析中...',
        analyze_nutrition: '分析营养成分',
        upload_failed: '图片上传失败',
        analysis_failed: '分析失败',
        data_format_error: '收到的数据格式不正确，无法显示分析结果',
        analysis_timeout: '分析超时，请检查网络连接后重试',
        connection_failed: '连接分析服务失败',
        file_size_error: '文件大小必须小于10MB',
        file_type_error: '请选择有效的图片文件（JPEG、PNG、WebP）',
        wait_analysis: '等待n8n分析结果...',
        click_upload_hint: '点击或按回车键选择照片进行营养分析'
    },
    en: {
        // Units and dynamic text  
        unit_grams: 'g',
        analyzing_progress: 'AI Analyzing...',
        analyze_nutrition: 'Analyze Nutrition',
        upload_failed: 'Image upload failed',
        analysis_failed: 'Analysis failed',
        data_format_error: 'Invalid data format received, unable to display results',
        analysis_timeout: 'Analysis timeout, please check network connection and retry',
        connection_failed: 'Failed to connect to analysis service',
        file_size_error: 'File size must be less than 10MB',
        file_type_error: 'Please select a valid image file (JPEG, PNG, WebP)',
        wait_analysis: 'Waiting for n8n analysis results...',
        click_upload_hint: 'Click or press Enter to select a photo for nutrition analysis'
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupLanguageToggle();
});

function setupEventListeners() {
    // File input change
    photoInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Remove image
    removeBtn.addEventListener('click', removeImage);
    
    // Analyze button
    analyzeBtn.addEventListener('click', analyzeNutrition);
    
    // Click to upload
    uploadArea.addEventListener('click', () => photoInput.click());
}

// Setup Language Toggle
function setupLanguageToggle() {
    const langToggle = document.getElementById('langToggle');
    const langText = document.querySelector('.lang-text');
    
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
            updateLanguage();
            updateLanguageButton();
        });
    }
    
    // Set initial language button state
    updateLanguageButton();
}

// Update Language Button
function updateLanguageButton() {
    const langText = document.querySelector('.lang-text');
    if (langText) {
        langText.textContent = currentLanguage === 'zh' ? 'EN' : '中文';
    }
}

// Update Language
function updateLanguage() {
    // Update all elements with data-zh and data-en attributes
    const elements = document.querySelectorAll('[data-zh][data-en]');
    elements.forEach(element => {
        const text = currentLanguage === 'zh' ? element.getAttribute('data-zh') : element.getAttribute('data-en');
        element.textContent = text;
    });
    
    // Update page title
    document.title = currentLanguage === 'zh' ? 
        '营养快拍AI - 即时营养分析' : 
        'NutriSnap AI - Instant Nutrition Analysis';
    
    // Update image alt text
    const previewImage = document.getElementById('previewImage');
    if (previewImage) {
        previewImage.alt = currentLanguage === 'zh' ? '美食预览' : 'Meal preview';
    }
    
    // Update aria-label for upload area
    updateUploadAreaAriaLabel();
    
    // Update nutrition values if results are showing
    updateNutritionUnits();
    
    console.log(`Language switched to: ${currentLanguage}`);
}

// Update Upload Area Aria Label
function updateUploadAreaAriaLabel() {
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.setAttribute('aria-label', translations[currentLanguage].click_upload_hint);
    }
}

// Update Nutrition Units
function updateNutritionUnits() {
    const nutritionValues = document.querySelectorAll('.nutrition-value');
    nutritionValues.forEach((element, index) => {
        if (index > 0) { // Skip calories (index 0), only update protein, carbs, fat
            const currentValue = element.textContent;
            const numericValue = currentValue.replace(/[^\d]/g, '');
            if (numericValue) {
                element.textContent = numericValue + translations[currentLanguage].unit_grams;
            }
        }
    });
}

// Get translated text
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        handleFile(files[0]);
    }
}

// File Selection Handler
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
}

// Handle File Processing
function handleFile(file) {
    selectedFile = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        uploadArea.style.display = 'none';
        previewArea.style.display = 'block';
        analyzeBtn.disabled = false;
        
        // Add success styling
        document.body.classList.add('success');
        
        // Upload image to webhook immediately when file is selected
        uploadImageToWebhook(file).catch(error => {
            console.error('Webhook上传失败，但继续允许用户分析:', error);
            // Don't block the UI, just log the error
            // User can still try to analyze with fallback mode
        });
    };
    reader.readAsDataURL(file);
}

// Upload Image to Webhook with enhanced debugging
async function uploadImageToWebhook(file, retryCount = 0) {
    const webhookUrl = 'https://harryleemedia.app.n8n.cloud/webhook/test';
    const maxRetries = 2;
    
    // Clear previous webhook state
    window.webhookResponse = null;
    window.webhookUploadSuccess = null;
    window.webhookError = null;
    
    console.log(`=== WEBHOOK UPLOAD ATTEMPT ${retryCount + 1}/${maxRetries + 1} ===`);
    console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
    });
    console.log('Target URL:', webhookUrl);
    
    try {
        // Create FormData with minimal required data
        const formData = new FormData();
        formData.append('image', file, file.name || 'upload.jpg');
        formData.append('timestamp', new Date().toISOString());
        
        console.log('FormData created successfully');
        
        // Set up timeout - increased for AI processing
        const timeout = 60000; // 60 seconds for AI analysis
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('Request timeout triggered');
            controller.abort();
        }, timeout);
        
        console.log('Sending fetch request...');
        
        // Simplified fetch request to avoid CORS issues
        const response = await fetch(webhookUrl, {
            method: 'POST',
            body: formData,
            signal: controller.signal
            // Removed headers to avoid CORS complications
        });
        
        clearTimeout(timeoutId);
        console.log('Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        if (response.ok) {
            console.log('✅ Webhook request successful!');
            
            // Get response content type
            const contentType = response.headers.get('content-type');
            console.log('Response content-type:', contentType);
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const responseData = await response.json();
                    console.log('✅ JSON response parsed successfully:', responseData);
                    
                    // Store webhook response for analysis
                    window.webhookResponse = responseData;
                    window.webhookUploadSuccess = true;
                    
                    // Trigger immediate display if data looks valid
                    if (Array.isArray(responseData) && responseData[0]?.output?.totals) {
                        console.log('🎯 Valid nutrition data detected, ready for analysis');
                    }
                    
                    return responseData;
                } catch (jsonError) {
                    console.error('❌ JSON parsing failed:', jsonError);
                    const textResponse = await response.text();
                    console.log('Raw text response:', textResponse);
                    
                    // Try to manually parse if it looks like JSON
                    if (textResponse.trim().startsWith('[') || textResponse.trim().startsWith('{')) {
                        try {
                            const manualParsed = JSON.parse(textResponse);
                            console.log('✅ Manual JSON parsing successful:', manualParsed);
                            window.webhookResponse = manualParsed;
                            window.webhookUploadSuccess = true;
                            return manualParsed;
                        } catch (e) {
                            console.error('❌ Manual parsing also failed:', e);
                        }
                    }
                    
                    window.webhookResponse = { rawResponse: textResponse };
                    window.webhookUploadSuccess = true;
                    return { rawResponse: textResponse };
                }
            } else {
                // Non-JSON response
                const textResponse = await response.text();
                console.log('Non-JSON response received:', textResponse);
                window.webhookResponse = { rawResponse: textResponse };
                window.webhookUploadSuccess = true;
                return { rawResponse: textResponse };
            }
        } else {
            console.error(`❌ HTTP Error ${response.status}: ${response.statusText}`);
            const errorText = await response.text();
            console.error('Error response body:', errorText);
            
            // Retry for server errors
            if ((response.status >= 500 || response.status === 429) && retryCount < maxRetries) {
                console.log(`🔄 Retrying in 2 seconds due to server error...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return await uploadImageToWebhook(file, retryCount + 1);
            }
            
            window.webhookUploadSuccess = false;
            window.webhookError = `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Webhook upload error:', error);
        
        if (error.name === 'AbortError') {
            console.error('Request aborted (timeout)');
            if (retryCount < maxRetries) {
                console.log(`🔄 Retrying in 1 second due to timeout...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return await uploadImageToWebhook(file, retryCount + 1);
            }
            window.webhookError = 'AI分析超时，请稍后再试或检查网络连接';
        } else if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
            console.error('Network/CORS error detected');
            if (retryCount < maxRetries) {
                console.log(`🔄 Retrying in 2 seconds due to network error...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return await uploadImageToWebhook(file, retryCount + 1);
            }
            window.webhookError = 'CORS或网络连接错误';
        } else {
            console.error('Unknown error:', error);
            window.webhookError = error.message || '未知错误';
        }
        
        window.webhookUploadSuccess = false;
        
        if (retryCount >= maxRetries) {
            console.error(`❌ All ${maxRetries + 1} attempts failed`);
        }
        
        throw error;
    }
}

// Remove Image
function removeImage() {
    selectedFile = null;
    previewImage.src = '';
    uploadArea.style.display = 'block';
    previewArea.style.display = 'none';
    analyzeBtn.disabled = true;
    resultsPanel.style.display = 'none';
    photoInput.value = '';
    
    // Clear webhook data
    window.webhookResponse = null;
    window.webhookUploadSuccess = null;
    window.webhookError = null;
    
    // Remove success styling
    document.body.classList.remove('success');
    
    console.log('图片已移除，webhook数据已清除');
}

// Analyze Nutrition
async function analyzeNutrition() {
    if (!selectedFile) return;
    
    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    analyzeBtn.disabled = true;
    document.body.classList.add('loading');
    
    try {
        console.log('=== 开始营养分析 ===');
        console.log('当前webhook状态:', {
            webhookResponse: !!window.webhookResponse,
            webhookUploadSuccess: window.webhookUploadSuccess,
            webhookError: window.webhookError
        });
        
        // Check if we have webhook response data
        if (window.webhookResponse) {
            console.log('✅ 使用webhook响应数据进行分析');
            console.log('Webhook响应内容:', window.webhookResponse);
            try {
                showResultsFromWebhook(window.webhookResponse);
            } catch (parseError) {
                console.error('❌ Webhook数据解析失败:', parseError);
                showError(t('data_format_error'));
                return;
            }
        } else if (window.webhookUploadSuccess === false) {
            console.log('❌ Webhook上传失败');
            const errorMsg = window.webhookError || '图片上传失败';
            showError(`分析失败: ${errorMsg}`);
            return;
        } else {
            console.log('⏳ 等待n8n webhook响应...');
            // Wait for webhook response - increased wait time for n8n processing
            let retryCount = 0;
            const maxRetries = 60; // Wait up to 30 seconds (500ms * 60) for n8n processing
            
            while (!window.webhookResponse && window.webhookUploadSuccess !== false && retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 500));
                retryCount++;
                
                // Show progress to user every second
                if (retryCount % 2 === 0) {
                    const progress = Math.round(retryCount/maxRetries*100);
                    const timeElapsed = Math.round(retryCount * 0.5);
                    console.log(`⏳ 等待n8n分析结果... ${progress}% (${timeElapsed}秒)`);
                    
                    // Update button text to show progress and time
                    if (btnText) {
                        btnText.textContent = `${t('analyzing_progress')} ${timeElapsed}s`;
                    }
                }
                
                // Check if webhook response arrived during wait
                if (window.webhookResponse) {
                    console.log('🎉 收到n8n webhook响应!');
                    break;
                }
            }
            
            // Reset button text
            if (btnText) {
                btnText.textContent = t('analyze_nutrition');
            }
            
            if (window.webhookResponse) {
                console.log('✅ 收到webhook响应，显示结果');
                console.log('最终webhook响应:', window.webhookResponse);
                try {
                    showResultsFromWebhook(window.webhookResponse);
                } catch (parseError) {
                    console.error('❌ Webhook数据解析失败:', parseError);
                    showError(t('data_format_error'));
                    return;
                }
            } else if (window.webhookUploadSuccess === false) {
                console.log('❌ Webhook最终失败');
                const errorMsg = window.webhookError || '分析服务连接失败';
                showError(`分析失败: ${errorMsg}`);
                return;
            } else {
                console.log('⏰ 等待超时');
                showError(t('analysis_timeout'));
                return;
            }
        }
        
    } catch (error) {
        console.error('Analysis failed:', error);
        showError('分析失败，请重试。');
    } finally {
        // Reset button state
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        analyzeBtn.disabled = false;
        document.body.classList.remove('loading');
    }
}

// Simulate Nutrition Analysis API
async function simulateNutritionAnalysis() {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate realistic nutrition data based on common meal types
            const nutritionData = generateRealisticNutrition();
            resolve(nutritionData);
        }, 2000); // 2 second delay to simulate API processing
    });
}

// Generate Realistic Nutrition Data
function generateRealisticNutrition() {
    // Common meal nutritional profiles
    const mealTypes = [
        { calories: 450, protein: 25, carbs: 35, fat: 18 }, // Chicken salad
        { calories: 680, protein: 32, carbs: 65, fat: 24 }, // Pasta dish
        { calories: 520, protein: 28, carbs: 45, fat: 22 }, // Rice bowl
        { calories: 380, protein: 15, carbs: 55, fat: 12 }, // Vegetarian meal
        { calories: 720, protein: 35, carbs: 48, fat: 32 }, // Burger and fries
        { calories: 340, protein: 20, carbs: 25, fat: 16 }, // Salad with protein
        { calories: 590, protein: 24, carbs: 72, fat: 18 }, // Pizza slice
        { calories: 420, protein: 18, carbs: 38, fat: 20 }, // Sandwich
    ];
    
    // Add some randomness for variety
    const baseMeal = mealTypes[Math.floor(Math.random() * mealTypes.length)];
    const variance = 0.15; // 15% variance
    
    return {
        calories: Math.round(baseMeal.calories * (1 + (Math.random() - 0.5) * variance)),
        protein: Math.round(baseMeal.protein * (1 + (Math.random() - 0.5) * variance)),
        carbs: Math.round(baseMeal.carbs * (1 + (Math.random() - 0.5) * variance)),
        fat: Math.round(baseMeal.fat * (1 + (Math.random() - 0.5) * variance))
    };
}

// Show Results
function showResults() {
    const nutrition = generateRealisticNutrition();
    
    // Animate counter updates
    animateCounter(caloriesEl, nutrition.calories, '');
    animateCounter(proteinEl, nutrition.protein, '克');
    animateCounter(carbsEl, nutrition.carbs, '克');
    animateCounter(fatEl, nutrition.fat, '克');
    
    // Show results panel
    resultsPanel.style.display = 'block';
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show Results from Webhook Response
function showResultsFromWebhook(webhookData) {
    console.log('显示webhook分析结果:', webhookData);
    
    // Initialize nutrition object
    let nutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };
    
    try {
        // Handle the n8n webhook response format: array with output object
        let dataToProcess = webhookData;
        
        // If webhookData is an array, get the first element
        if (Array.isArray(webhookData) && webhookData.length > 0) {
            dataToProcess = webhookData[0];
            console.log('处理数组格式的webhook响应:', dataToProcess);
        }
        
        // Check if data has an 'output' property (n8n format)
        if (dataToProcess.output) {
            console.log('找到output字段:', dataToProcess.output);
            
            // Check for totals in the output
            if (dataToProcess.output.totals) {
                const totals = dataToProcess.output.totals;
                console.log('找到totals字段:', totals);
                
                // Extract nutrition values with proper field names
                nutrition.calories = Number(totals.calories_kcal) || 0;
                nutrition.protein = Number(totals.protein_g) || 0;
                nutrition.carbs = Number(totals.carbs_g) || 0;
                nutrition.fat = Number(totals.fat_g) || 0;
                
                console.log('从totals提取的营养数据:', nutrition);
                
                // Extract meal summary information
                if (dataToProcess.output.mealSummary) {
                    const summary = dataToProcess.output.mealSummary;
                    nutrition.quality = summary.quality || '';
                    nutrition.overallTip = summary.overallTip || '';
                    console.log('提取的品质和建议:', {
                        quality: nutrition.quality,
                        overallTip: nutrition.overallTip
                    });
                }
            }
            // If no totals, try to calculate from items
            else if (dataToProcess.output.items && Array.isArray(dataToProcess.output.items)) {
                console.log('从items计算总营养值:', dataToProcess.output.items);
                
                const items = dataToProcess.output.items;
                items.forEach(item => {
                    nutrition.calories += Number(item.calories_kcal) || 0;
                    nutrition.protein += Number(item.protein_g) || 0;
                    nutrition.carbs += Number(item.carbs_g) || 0;
                    nutrition.fat += Number(item.fat_g) || 0;
                });
                
                console.log('从items计算出的营养数据:', nutrition);
            }
        }
        // Fallback: try other possible formats
        else if (dataToProcess.totals) {
            const totals = dataToProcess.totals;
            nutrition.calories = Number(totals.calories_kcal) || Number(totals.calories) || 0;
            nutrition.protein = Number(totals.protein_g) || Number(totals.protein) || 0;
            nutrition.carbs = Number(totals.carbs_g) || Number(totals.carbs) || 0;
            nutrition.fat = Number(totals.fat_g) || Number(totals.fat) || 0;
        }
        else if (dataToProcess.calories !== undefined) {
            // Direct format
            nutrition.calories = Number(dataToProcess.calories) || Number(dataToProcess.calories_kcal) || 0;
            nutrition.protein = Number(dataToProcess.protein) || Number(dataToProcess.protein_g) || 0;
            nutrition.carbs = Number(dataToProcess.carbs) || Number(dataToProcess.carbs_g) || 0;
            nutrition.fat = Number(dataToProcess.fat) || Number(dataToProcess.fat_g) || 0;
        }
        
        // If still no data found, check if it's a text response
        if (nutrition.calories === 0 && nutrition.protein === 0 && nutrition.carbs === 0 && nutrition.fat === 0) {
            if (dataToProcess.rawResponse) {
                console.log('尝试解析原始文本响应:', dataToProcess.rawResponse);
                // Try to parse the raw response as JSON
                try {
                    const parsedResponse = JSON.parse(dataToProcess.rawResponse);
                    return showResultsFromWebhook(parsedResponse);
                } catch (e) {
                    console.error('无法解析原始响应为JSON:', e);
                }
            }
            
            console.error('❌ 未找到有效的营养数据，无法显示结果');
            throw new Error('Webhook数据格式不正确，无法提取营养信息');
        }
    } catch (error) {
        console.error('解析webhook数据时出错:', error);
        throw error; // Re-throw to be handled by the calling function
    }
    
    // Ensure all values are valid numbers
    nutrition.calories = Math.round(Number(nutrition.calories) || 0);
    nutrition.protein = Math.round(Number(nutrition.protein) || 0);
    nutrition.carbs = Math.round(Number(nutrition.carbs) || 0);
    nutrition.fat = Math.round(Number(nutrition.fat) || 0);
    
    console.log('最终使用的营养数据:', nutrition);
    
    // Animate counter updates with webhook data
    animateCounter(caloriesEl, nutrition.calories, '');
    animateCounter(proteinEl, nutrition.protein, t('unit_grams'));
    animateCounter(carbsEl, nutrition.carbs, t('unit_grams'));
    animateCounter(fatEl, nutrition.fat, t('unit_grams'));
    
    // Show meal quality and suggestions if available
    const mealInfoSection = document.getElementById('mealInfoSection');
    const qualityText = document.getElementById('qualityText');
    const suggestionText = document.getElementById('suggestionText');
    
    if (nutrition.quality || nutrition.overallTip) {
        if (qualityText && nutrition.quality) {
            qualityText.textContent = nutrition.quality;
        }
        if (suggestionText && nutrition.overallTip) {
            suggestionText.textContent = nutrition.overallTip;
        }
        if (mealInfoSection) {
            mealInfoSection.style.display = 'block';
        }
        console.log('显示餐食品质和建议信息');
    } else {
        if (mealInfoSection) {
            mealInfoSection.style.display = 'none';
        }
        console.log('没有品质和建议信息可显示');
    }
    
    // Show results panel
    resultsPanel.style.display = 'block';
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Animate Counter
function animateCounter(element, target, suffix) {
    const duration = 1000; // 1 second
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.round(current) + suffix;
    }, duration / steps);
}

// Show Error or Info Message
function showError(message, isWarning = false) {
    // Create or update error message
    let errorEl = document.querySelector('.error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        analyzeBtn.parentNode.insertBefore(errorEl, analyzeBtn.nextSibling);
    }
    
    // Different styles for warnings vs errors
    const backgroundColor = isWarning ? '#ff9800' : message.includes('离线模式') ? '#2196F3' : '#ff6b6b';
    const autoHideTime = message.includes('离线模式') ? 3000 : 5000; // Shorter for info messages
    
    errorEl.style.cssText = `
        background: ${backgroundColor};
        color: white;
        padding: 16px;
        border-radius: 12px;
        margin: 16px 0;
        text-align: center;
        font-weight: 500;
        animation: slideUp 0.3s ease-out;
        transition: all 0.3s ease;
    `;
    
    errorEl.textContent = message;
    
    // Auto-hide after specified time
    setTimeout(() => {
        if (errorEl.parentNode) {
            errorEl.style.opacity = '0';
            errorEl.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (errorEl.parentNode) {
                    errorEl.remove();
                }
            }, 300);
        }
    }, autoHideTime);
}

// File Size Validation
function validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (file.size > maxSize) {
        showError(t('file_size_error'));
        return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
        showError(t('file_type_error'));
        return false;
    }
    
    return true;
}

// Enhanced File Handler with Validation
function handleFileEnhanced(file) {
    if (!validateFile(file)) {
        return;
    }
    
    handleFile(file);
}


// Add keyboard accessibility
document.addEventListener('keydown', function(e) {
    // Space or Enter on upload area triggers file selection
    if ((e.key === ' ' || e.key === 'Enter') && e.target === uploadArea) {
        e.preventDefault();
        photoInput.click();
    }
    
    // Escape key removes image
    if (e.key === 'Escape' && selectedFile) {
        removeImage();
    }
});

// Make upload area focusable for keyboard navigation
uploadArea.setAttribute('tabindex', '0');
uploadArea.setAttribute('role', 'button');
uploadArea.setAttribute('aria-label', '点击或按回车键选择照片进行营养分析');

// Add loading animation for better UX
function addLoadingAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        
        .loading .upload-card {
            animation: pulse 2s infinite;
        }
    `;
    document.head.appendChild(style);
}

// Initialize loading animations
addLoadingAnimation();

// Performance optimization: Lazy load heavy features
const lazyFeatures = () => {
    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'slideUp 0.6s ease-out';
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        observer.observe(card);
    });
};

// Initialize lazy features when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lazyFeatures);
} else {
    lazyFeatures();
}

// Test function for webhook response parsing (for development)
function testWebhookResponse() {
    const testResponse = [
        {
            "output": {
                "items": [
                    {
                        "name": "Chicken nuggets",
                        "portion_g": 120,
                        "calories_kcal": 300,
                        "protein_g": 18,
                        "carbs_g": 16,
                        "fat_g": 18,
                        "method": "fried",
                        "dietFit": ["not vegetarian", "not vegan"],
                        "note": "High in protein but also high in saturated fat due to deep frying",
                        "tip": "Choose grilled chicken strips instead for less unhealthy fat"
                    },
                    {
                        "name": "Hamburger with cheese",
                        "portion_g": 160,
                        "calories_kcal": 420,
                        "protein_g": 22,
                        "carbs_g": 32,
                        "fat_g": 22,
                        "method": "grilled",
                        "dietFit": ["not vegetarian", "not vegan"],
                        "note": "Good protein source but high in saturated fat from cheese and meat",
                        "tip": "Add lettuce and tomato for extra nutrients and fiber"
                    },
                    {
                        "name": "French fries",
                        "portion_g": 80,
                        "calories_kcal": 240,
                        "protein_g": 3,
                        "carbs_g": 32,
                        "fat_g": 12,
                        "method": "fried",
                        "dietFit": ["vegetarian", "not vegan"],
                        "note": "High in refined carbs and unhealthy trans fats from deep frying",
                        "tip": "Replace with baked sweet potato fries or side salad"
                    }
                ],
                "totals": {
                    "calories_kcal": 1040,
                    "protein_g": 41,
                    "carbs_g": 90,
                    "fat_g": 59
                },
                "mealSummary": {
                    "quality": "high calorie, high fat, moderate protein",
                    "overallTip": "This meal is very high in calories and unhealthy fats. Consider replacing fried items with grilled options and adding vegetables for better nutritional balance"
                }
            }
        }
    ];
    
    console.log('测试webhook响应解析:', testResponse);
    showResultsFromWebhook(testResponse);
}

// Make test function available globally for debugging
window.testWebhookResponse = testWebhookResponse;