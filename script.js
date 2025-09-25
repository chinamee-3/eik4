// --- 設定 ---
const DAILY_QUOTAS = {
    fill_in_the_blank: 3,
    scramble: 2,
    vocabulary: 10
};

// --- HTML要素の取得 ---
const questionTypeElement = document.getElementById('question-type');
const questionElement = document.getElementById('question');
const choicesContainer = document.getElementById('choices-container');
const feedbackElement = document.getElementById('feedback');
const nextButton = document.getElementById('next-button');

// --- アプリの状態を管理する変数 ---
let allQuestions = {}; // 全ての問題データを格納
let todaysQuizIds = []; // 今日のクイズの問題IDリスト
let persistentMistakeIds = []; // 間違えて、まだ正解していない問題のIDリスト
let currentQuestionIndex = 0; // 今日のクイズの何問目か
let isReviewQuestion = false; // 現在の問題が復習問題かどうか

// --- 初期化処理 ---
// JSONファイルを読み込み、クイズを開始する
fetch('questions.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('questions.jsonの読み込みに失敗しました。');
        }
        return response.json();
    })
    .then(data => {
        allQuestions = data;
        initializeQuiz();
    })
    .catch(error => {
        console.error(error);
        questionElement.textContent = '問題データの読み込みに失敗しました。';
    });

/**
 * クイズの初期化を行う関数
 */
function initializeQuiz() {
    const todayStr = getTodayDateString();
    const lastQuizDate = localStorage.getItem('lastQuizDate');
    
    // 最後にプレイした日付と今日の日付を比較
    if (lastQuizDate !== todayStr) {
        // 日付が違う場合、新しい「今日の問題」を生成する
        generateNewDailyQuiz(todayStr);
    } else {
        // 同じ日の場合、保存されたデータを読み込む
        loadStateFromStorage();
    }
    
    if (todaysQuizIds.length === 0 || currentQuestionIndex >= todaysQuizIds.length) {
        displayQuizFinished();
        return;
    }

    displayQuestion();
}

/**
 * 「今日の問題」を新しく生成する関数
 */
function generateNewDailyQuiz(todayStr) {
    console.log("新しい一日のクイズを生成します。");
    persistentMistakeIds = loadStateFromStorage().persistentMistakeIds;
    let newDailyIds = [];

    // 各カテゴリから規定数の問題をランダムに選出
    for (const category in DAILY_QUOTAS) {
        const questionIds = allQuestions[category].map(q => q.id);
        const shuffledIds = shuffleArray(questionIds);
        const selectedIds = shuffledIds.slice(0, DAILY_QUOTAS[category]);
        newDailyIds.push(...selectedIds);
    }

    // 「今日の問題」リストと「復習問題」リストを結合
    todaysQuizIds = [...newDailyIds, ...persistentMistakeIds];
    currentQuestionIndex = 0;
    
    // 新しい状態を保存
    localStorage.setItem('lastQuizDate', todayStr);
    localStorage.setItem('todaysQuizIds', JSON.stringify(todaysQuizIds));
    savePersistentMistakes();
}

/**
 * 問題を表示する関数
 */
function displayQuestion() {
    if (currentQuestionIndex >= todaysQuizIds.length) {
        displayQuizFinished();
        return;
    }

    const questionId = todaysQuizIds[currentQuestionIndex];
    const questionData = findQuestionById(questionId);

    // 問題が見つからない場合はエラー処理
    if (!questionData) {
        console.error(`ID: ${questionId} の問題が見つかりません。`);
        currentQuestionIndex++;
        displayQuestion();
        return;
    }
    
    // 現在の問題が復習問題か判定
    isReviewQuestion = persistentMistakeIds.includes(questionId);
    
    // カテゴリ名を表示
    let categoryName = getCategoryName(questionData.category);
    if (isReviewQuestion) {
        categoryName += ' (復習)';
    }
    questionTypeElement.textContent = `【${categoryName}】 (${currentQuestionIndex + 1}/${todaysQuizIds.length})`;

    // 問題文と選択肢を表示
    questionElement.textContent = questionData.question;
    choicesContainer.innerHTML = '';
    const choices = shuffleArray([...questionData.choices]);
    choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.classList.add('choice-button');
        choicesContainer.appendChild(button);
        button.addEventListener('click', () => checkAnswer(choice, questionData));
    });
}

/**
 * 回答をチェックする関数
 */
function checkAnswer(selectedChoice, questionData) {
    const isCorrect = selectedChoice === questionData.answer;
    
    if (isCorrect) {
        feedbackElement.textContent = "正解！";
        feedbackElement.style.color = 'green';
        // もし復習問題で正解した場合、間違えた問題リストから削除
        if (isReviewQuestion) {
            persistentMistakeIds = persistentMistakeIds.filter(id => id !== questionData.id);
            savePersistentMistakes();
        }
    } else {
        feedbackElement.textContent = `不正解… 正解は「${questionData.answer}」です。`;
        feedbackElement.style.color = 'red';
        // 間違えた問題をリストに追加（重複しないように）
        if (!persistentMistakeIds.includes(questionData.id)) {
            persistentMistakeIds.push(questionData.id);
            savePersistentMistakes();
        }
    }

    document.querySelectorAll('.choice-button').forEach(b => b.disabled = true);
    nextButton.style.display = 'block';
}

/**
 * 「次の問題へ」ボタンの処理
 */
nextButton.addEventListener('click', () => {
    currentQuestionIndex++;
    feedbackElement.textContent = '';
    nextButton.style.display = 'none';
    displayQuestion();
});

/**
 * 全問終了時の表示
 */
function displayQuizFinished() {
    questionTypeElement.textContent = 'お疲れ様でした！';
    questionElement.textContent = '今日の問題はすべて終了しました。また明日挑戦してください。';
    choicesContainer.innerHTML = '';
    nextButton.style.display = 'none';
}

// --- ヘルパー関数 ---

/**
 * YYYY-MM-DD形式の今日の日付文字列を返す
 */
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * localStorageから状態を読み込む
 * @returns {object} { todaysQuizIds, persistentMistakeIds }
 */
function loadStateFromStorage() {
    const storedQuizIds = JSON.parse(localStorage.getItem('todaysQuizIds') || '[]');
    const storedMistakeIds = JSON.parse(localStorage.getItem('persistentMistakeIds') || '[]');
    todaysQuizIds = storedQuizIds;
    persistentMistakeIds = storedMistakeIds;
    return { todaysQuizIds, persistentMistakeIds };
}

/**
 * 間違えた問題リストをlocalStorageに保存
 */
function savePersistentMistakes() {
    localStorage.setItem('persistentMistakeIds', JSON.stringify(persistentMistakeIds));
}

/**
 * IDから問題オブジェクト全体を検索
 * @param {string} id 
 * @returns {object|null}
 */
function findQuestionById(id) {
    for (const category in allQuestions) {
        const found = allQuestions[category].find(q => q.id === id);
        if (found) {
            return { ...found, category: category }; // カテゴリ情報も付与して返す
        }
    }
    return null;
}

/**
 * カテゴリIDから日本語名を取得
 * @param {string} categoryId 
 * @returns {string}
 */
function getCategoryName(categoryId) {
    if (categoryId === 'fill_in_the_blank') return '穴埋め問題';
    if (categoryId === 'scramble') return '並べ替え問題';
    if (categoryId === 'vocabulary') return '単語問題';
    return '問題';
}

/**
 * 配列をシャッフルする（フィッシャー–イェーツのシャッフル）
 * @param {Array} array 
 * @returns {Array}
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
