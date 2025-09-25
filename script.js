// HTML要素を取得
const questionTypeElement = document.getElementById('question-type');
const questionElement = document.getElementById('question');
const choicesContainer = document.getElementById('choices-container');
const feedbackElement = document.getElementById('feedback');
const nextButton = document.getElementById('next-button');

let allQuestions = [];
let currentQuestionIndex = 0;
let currentCategory = 'fill_in_the_blank'; // 最初は穴埋め問題から

// 1. JSONファイルを読み込む
fetch('questions.json')
    .then(response => response.json())
    .then(data => {
        allQuestions = data;
        displayQuestion();
    });

// 2. 問題を表示する関数
function displayQuestion() {
    // 問題データを取得
    const questionData = allQuestions[currentCategory][currentQuestionIndex];

    // 問題文とカテゴリを表示
    questionTypeElement.textContent = `【${currentCategory}】`;
    questionElement.textContent = questionData.question;
    
    // 選択肢をクリア
    choicesContainer.innerHTML = '';
    
    // 選択肢ボタンを作成して表示
    questionData.choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.classList.add('choice-button');
        choicesContainer.appendChild(button);
        
        button.addEventListener('click', () => checkAnswer(choice, questionData.answer));
    });
}

// 3. 回答をチェックする関数 (今はまだ骨組みだけ)
function checkAnswer(selectedChoice, correctAnswer) {
    if (selectedChoice === correctAnswer) {
        feedbackElement.textContent = "正解！";
        feedbackElement.style.color = 'green';
    } else {
        feedbackElement.textContent = `不正解… 正解は「${correctAnswer}」です。`;
        feedbackElement.style.color = 'red';
    }
    
    // 全てのボタンを無効化
    document.querySelectorAll('.choice-button').forEach(button => {
        button.disabled = true;
    });

    // 「次の問題へ」ボタンを表示
    nextButton.style.display = 'block';
}

// 「次の問題へ」ボタンのイベント (今はまだ骨組みだけ)
nextButton.addEventListener('click', () => {
    // ここに次の問題に進む処理を書く
    console.log("次の問題へ！");
});
