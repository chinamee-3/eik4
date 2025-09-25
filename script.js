// HTML要素を取得
const questionTypeElement = document.getElementById('question-type');
const questionElement = document.getElementById('question');
const choicesContainer = document.getElementById('choices-container');
const feedbackElement = document.getElementById('feedback');
const nextButton = document.getElementById('next-button');

// クイズの状態を管理する変数
let allQuestions = [];
let currentQuestionIndex = 0;
let currentCategory = 'fill_in_the_blank'; // 最初のカテゴリ

// 1. JSONファイルを読み込む
fetch('questions.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('questions.jsonの読み込みに失敗しました。ファイル名やパスを確認してください。');
        }
        return response.json();
    })
    .then(data => {
        allQuestions = data;
        displayQuestion();
    })
    .catch(error => {
        console.error(error);
        questionElement.textContent = '問題データの読み込みに失敗しました。';
    });

// 2. 問題を表示する関数
function displayQuestion() {
    // 問題データを取得
    const questionData = allQuestions[currentCategory][currentQuestionIndex];

    // 問題文とカテゴリを表示
    let categoryName = '';
    if (currentCategory === 'fill_in_the_blank') {
        categoryName = '穴埋め問題';
    } else if (currentCategory === 'scramble') {
        categoryName = '並べ替え問題';
    } else if (currentCategory === 'vocabulary') {
        categoryName = '単語問題';
    }
    questionTypeElement.textContent = `【${categoryName}】`;
    questionElement.textContent = questionData.question;
    
    // 前回の選択肢をクリア
    choicesContainer.innerHTML = '';
    
    // 選択肢ボタンを作成して表示
    questionData.choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.classList.add('choice-button');
        choicesContainer.appendChild(button);
        
        // ボタンがクリックされたら回答をチェック
        button.addEventListener('click', () => checkAnswer(choice, questionData.answer));
    });
}

// 3. 回答をチェックする関数
function checkAnswer(selectedChoice, correctAnswer) {
    // 正解・不正解をフィードバック表示
    if (selectedChoice === correctAnswer) {
        feedbackElement.textContent = "正解！";
        feedbackElement.style.color = 'green';
    } else {
        feedbackElement.textContent = `不正解… 正解は「${correctAnswer}」です。`;
        feedbackElement.style.color = 'red';
    }
    
    // 回答後は全ての選択肢ボタンを無効化する
    document.querySelectorAll('.choice-button').forEach(button => {
        button.disabled = true;
    });

    // 「次の問題へ」ボタンを表示する
    nextButton.style.display = 'block';
}

// 4. 「次の問題へ」ボタンがクリックされたときの処理
nextButton.addEventListener('click', () => {
    currentQuestionIndex++; // 次の問題のインデックスへ

    // 現在のカテゴリにまだ問題が残っているか確認
    if (currentQuestionIndex < allQuestions[currentCategory].length) {
        // 次の問題を表示
        displayQuestion();
        
        // 表示をリセット
        feedbackElement.textContent = '';
        nextButton.style.display = 'none';
    } else {
        // カテゴリの全問が終了した場合、次のカテゴリへ進む
        if (currentCategory === 'fill_in_the_blank') {
            currentCategory = 'scramble';
        } else if (currentCategory === 'scramble') {
            currentCategory = 'vocabulary';
        } else {
            // 全てのクイズが終了した場合
            questionTypeElement.textContent = '';
            questionElement.textContent = '全てのクイズが終了しました！お疲れ様でした！';
            choicesContainer.innerHTML = '';
            feedbackElement.textContent = '';
            nextButton.style.display = 'none';
            return; // 処理を終了
        }
        
        // 新しいカテゴリの最初の問題へ
        currentQuestionIndex = 0;
        alert(`次に【${currentCategory}】の問題を始めます！`);
        
        // 新しいカテゴリの最初の問題を表示
        displayQuestion();
        
        // 表示をリセット
        feedbackElement.textContent = '';
        nextButton.style.display = 'none';
    }
});
