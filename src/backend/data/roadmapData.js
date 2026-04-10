export const LADDER_TRACKS = {
  js: {
    name: 'JavaScript Mastery', icon: '🟨', weeks: 10,
    steps: [
      { id: 's1', title: 'JS Foundations', level: 'beginner', duration: '2 weeks', topics: ['Variables & Types', 'Functions', 'DOM Basics', 'Events'], video: { title: 'JavaScript Full Course for Beginners', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', channel: 'freeCodeCamp' }, quiz: [
        { q: 'Which keyword declares a block-scoped variable in JS?', opts: ['var','let','const','def'], ans: 1 },
        { q: 'What does DOM stand for?', opts: ['Document Object Model','Data Object Map','Document Option Method','None'], ans: 0 },
        { q: 'Which method adds an element to the end of an array?', opts: ['shift()','unshift()','push()','pop()'], ans: 2 }
      ], days: ['D1','D2','D3','D4','D5'] },
      { id: 's2', title: 'Async JavaScript', level: 'intermediate', duration: '2 weeks', topics: ['Promises', 'Async/Await', 'Fetch API', 'Error Handling'], video: { title: 'JavaScript Async/Await — Full Tutorial', url: 'https://www.youtube.com/watch?v=_8gHHBlbziw', channel: 'Dave Gray' }, quiz: [
        { q: 'What does async/await in JS help with?', opts: ['Styling','Database queries','Asynchronous code','Memory management'], ans: 2 },
        { q: 'Which method is used to handle rejected Promises?', opts: ['.then()','.catch()','.finally()','.reject()'], ans: 1 },
        { q: 'What does the Fetch API return?', opts: ['JSON','String','Promise','Array'], ans: 2 }
      ], days: ['D6','D7','D8','D9','D10'] },
      { id: 's3', title: 'ES6+ Modern JS', level: 'intermediate', duration: '2 weeks', topics: ['Arrow Functions', 'Destructuring', 'Spread/Rest', 'Modules'], video: { title: 'ES6 JavaScript Tutorial', url: 'https://www.youtube.com/watch?v=NCwa_xi0Uuc', channel: 'Traversy Media' }, quiz: [
        { q: 'What is the arrow function syntax in JS?', opts: ['function()=>','()=>','->','fn()'], ans: 1 },
        { q: 'What does the spread operator (...) do?', opts: ['Creates loops','Copies/expands iterables','Declares variables','Throws errors'], ans: 1 },
        { q: 'How do you export a function in ES6 modules?', opts: ['module.function','export function','require()','import from'], ans: 1 }
      ], days: ['D11','D12','D13','D14','D15'] },
      { id: 's4', title: 'Data Structures in JS', level: 'advanced', duration: '2 weeks', topics: ['Arrays & Objects', 'Maps & Sets', 'Linked Lists', 'Stacks & Queues'], video: { title: 'Data Structures in JavaScript', url: 'https://www.youtube.com/watch?v=t2CEgPsws3U', channel: 'CS Dojo' }, quiz: [
        { q: 'Which JS structure stores key-value pairs?', opts: ['Array','Set','Map','Stack'], ans: 2 },
        { q: 'What is the time complexity of accessing an array element?', opts: ['O(n)','O(log n)','O(1)','O(n²)'], ans: 2 },
        { q: 'Which data structure uses FIFO order?', opts: ['Stack','Queue','Heap','Tree'], ans: 1 }
      ], days: ['D16','D17','D18','D19','D20'] },
      { id: 's5', title: 'JS Capstone Project', level: 'advanced', duration: '2 weeks', topics: ['Project Planning', 'Component Design', 'State Management', 'Deployment'], video: { title: 'Build 15 JavaScript Projects', url: 'https://www.youtube.com/watch?v=3PHXvlpOkf4', channel: 'freeCodeCamp' }, quiz: [
        { q: 'What is the main purpose of state management?', opts: ['Styling apps','Managing data flow','Server setup','Database design'], ans: 1 },
        { q: 'Which tool is commonly used to bundle JS for production?', opts: ['Webpack','Git','Node','Chrome'], ans: 0 },
        { q: 'What is a component in web development?', opts: ['A CSS rule','A database table','A reusable UI piece','A server function'], ans: 2 }
      ], days: ['D21','D22','D23','D24','D25'] }
    ]
  },
  python: {
    name: 'Python Mastery', icon: '🐍', weeks: 8,
    steps: [
      { id: 'p1', title: 'Python Fundamentals', level: 'beginner', duration: '2 weeks', topics: ['Variables', 'Data Types', 'Control Flow', 'Functions'], video: { title: 'Python for Beginners – Full Course', url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', channel: 'Mosh' }, quiz: [
        { q: 'Which keyword is used to define a function in Python?', opts: ['function','def','fn','define'], ans: 1 },
        { q: 'What is the output of type(3.14)?', opts: ['int','float','double','decimal'], ans: 1 },
        { q: 'Which operator is used for exponentiation in Python?', opts: ['*','**','^','exp()'], ans: 1 }
      ], days: ['D1','D2','D3','D4','D5'] },
      { id: 'p2', title: 'Python OOP', level: 'intermediate', duration: '2 weeks', topics: ['Classes', 'Inheritance', 'Polymorphism', 'Magic Methods'], video: { title: 'Object Oriented Programming in Python', url: 'https://www.youtube.com/watch?v=JeznW_7DlB0', channel: 'Mosh' }, quiz: [
        { q: 'What is a constructor method called in Python?', opts: ['__init__','__new__','constructor','init'], ans: 0 },
        { q: 'Which concept allows a class to inherit from another?', opts: ['Polymorphism','Encapsulation','Inheritance','Abstraction'], ans: 2 },
        { q: 'What is self in Python?', opts: ['A keyword','Refers to current instance','A data type','A built-in function'], ans: 1 }
      ], days: ['D6','D7','D8','D9','D10'] },
      { id: 'p3', title: 'Data Science Basics', level: 'intermediate', duration: '2 weeks', topics: ['NumPy', 'Pandas', 'Data Visualization', 'Statistics'], video: { title: 'Pandas & NumPy Tutorial — Python Libraries', url: 'https://www.youtube.com/watch?v=ZyhVh-qRZPA', channel: 'Keith Galli' }, quiz: [
        { q: 'Which Python library is used for data manipulation?', opts: ['NumPy','Pandas','Matplotlib','Scikit-learn'], ans: 1 },
        { q: 'What does df.head() do in Pandas?', opts: ['Shows last rows','Shows column names','Shows first 5 rows','Deletes rows'], ans: 2 },
        { q: 'Which library is used for plotting charts in Python?', opts: ['Pandas','NumPy','Matplotlib','Scikit-learn'], ans: 2 }
      ], days: ['D11','D12','D13','D14','D15'] },
      { id: 'p4', title: 'Machine Learning Intro', level: 'advanced', duration: '1 week', topics: ['Supervised Learning', 'Algorithms', 'Scikit-learn', 'Model Evaluation'], video: { title: 'Machine Learning with Python', url: 'https://www.youtube.com/watch?v=7eh4d6sabA0', channel: 'freeCodeCamp' }, quiz: [
        { q: 'What type of ML uses labeled data?', opts: ['Unsupervised','Reinforcement','Supervised','Semi-supervised'], ans: 2 },
        { q: 'What is overfitting in ML?', opts: ['Model trains too fast','Model performs poorly on training data','Model performs well on training but poorly on new data','Model makes correct predictions'], ans: 2 },
        { q: 'Which scikit-learn function splits data into train/test sets?', opts: ['split_data()','train_test_split()','partition()','cross_validate()'], ans: 1 }
      ], days: ['D16','D17','D18','D19','D20'] },
      { id: 'p5', title: 'Python Capstone', level: 'advanced', duration: '1 week', topics: ['Project Design', 'APIs', 'Deployment', 'Documentation'], video: { title: 'Flask Python Tutorial – Build a Web App', url: 'https://www.youtube.com/watch?v=Z1RJmh_OqeA', channel: 'Tech With Tim' }, quiz: [
        { q: 'What is a REST API?', opts: ['A Python library','A database','An architectural style for networked apps','A testing framework'], ans: 2 },
        { q: 'Which Flask decorator defines a route?', opts: ['@app.path','@app.route','@route','@flask.url'], ans: 1 },
        { q: 'What does pip install do?', opts: ['Runs Python code','Installs Python packages','Starts Flask','Creates virtual environment'], ans: 1 }
      ], days: ['D21','D22','D23','D24','D25'] }
    ]
  },
  dsa: {
    name: 'DSA Mastery', icon: '🔷', weeks: 6,
    steps: [
      { id: 'd1', title: 'Arrays & Strings', level: 'beginner', duration: '1 week', topics: ['Array Operations', 'String Manipulation', 'Two Pointers', 'Sliding Window'], video: { title: 'Data Structures Full Course', url: 'https://www.youtube.com/watch?v=RBSGKlAvoiM', channel: 'freeCodeCamp' }, quiz: [
        { q: 'What is the time complexity of accessing an array by index?', opts: ['O(n)','O(log n)','O(1)','O(n²)'], ans: 2 },
        { q: 'Which technique uses two index pointers moving toward each other?', opts: ['Sliding Window','Two Pointers','Binary Search','DFS'], ans: 1 },
        { q: 'What is an in-place algorithm?', opts: ['Uses extra memory','Uses O(1) extra space','Runs in O(1) time','Sorts in reverse'], ans: 1 }
      ], days: ['D1','D2','D3','D4','D5'] },
      { id: 'd2', title: 'Linked Lists & Stacks', level: 'beginner', duration: '1 week', topics: ['Singly Linked List', 'Doubly Linked List', 'Stack', 'Queue'], video: { title: 'Linked Lists Explained – Full Course', url: 'https://www.youtube.com/watch?v=Hj_rA0dhr2I', channel: 'CS Dojo' }, quiz: [
        { q: 'What is the time complexity of inserting at the head of a linked list?', opts: ['O(n)','O(log n)','O(1)','O(n log n)'], ans: 2 },
        { q: 'Which data structure supports LIFO?', opts: ['Queue','Array','Stack','Heap'], ans: 2 },
        { q: 'In a doubly linked list, each node has:', opts: ['One pointer','Two pointers (next and prev)','No pointers','Three pointers'], ans: 1 }
      ], days: ['D6','D7','D8','D9','D10'] },
      { id: 'd3', title: 'Trees & Graphs', level: 'intermediate', duration: '2 weeks', topics: ['Binary Trees', 'BST', 'BFS / DFS', 'Graph Representation'], video: { title: 'Binary Trees and BST — Full Tutorial', url: 'https://www.youtube.com/watch?v=fAAZixBzIAI', channel: 'freeCodeCamp' }, quiz: [
        { q: 'What is the height of a balanced binary tree with n nodes?', opts: ['O(n)','O(log n)','O(n²)','O(1)'], ans: 1 },
        { q: 'Which traversal visits left, root, right?', opts: ['Pre-order','Post-order','In-order','Level-order'], ans: 2 },
        { q: 'BFS uses which data structure?', opts: ['Stack','Queue','Heap','Tree'], ans: 1 }
      ], days: ['D11','D12','D13','D14','D15'] },
      { id: 'd4', title: 'Sorting Algorithms', level: 'intermediate', duration: '1 week', topics: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Comparison Analysis'], video: { title: 'Sorting Algorithms Explained', url: 'https://www.youtube.com/watch?v=kgBjXUE_Nwc', channel: 'Timo Bingmann' }, quiz: [
        { q: 'What is the average time complexity of Quick Sort?', opts: ['O(n)','O(n log n)','O(n²)','O(log n)'], ans: 1 },
        { q: 'Which sort algorithm is considered stable?', opts: ['Quick Sort','Heap Sort','Selection Sort','Merge Sort'], ans: 3 },
        { q: 'What is the worst-case time complexity of Bubble Sort?', opts: ['O(n)','O(n log n)','O(n²)','O(log n)'], ans: 2 }
      ], days: ['D16','D17','D18','D19','D20'] },
      { id: 'd5', title: 'Dynamic Programming', level: 'advanced', duration: '1 week', topics: ['Memoization', 'Tabulation', 'Classic DP Problems', 'Optimization'], video: { title: 'Dynamic Programming — Learn to Solve Algorithmic Problems', url: 'https://www.youtube.com/watch?v=oBt53YbR9Kk', channel: 'freeCodeCamp' }, quiz: [
        { q: 'What is memoization?', opts: ['Sorting data','Caching function results','Dynamic memory allocation','Graph traversal'], ans: 1 },
        { q: 'Dynamic Programming breaks problems into:', opts: ['Random subproblems','Overlapping subproblems','Independent subproblems','Sequential steps'], ans: 1 },
        { q: 'What is the time complexity of computing Fibonacci with DP?', opts: ['O(2^n)','O(n²)','O(n)','O(log n)'], ans: 2 }
      ], days: ['D21','D22','D23','D24','D25'] }
    ]
  }
};