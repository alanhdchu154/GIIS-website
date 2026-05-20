#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function qq(moduleOrder, order, question, options, answer, explanation) {
  return { moduleOrder, order, question, options, answer, explanation, points: 1 };
}

function exam(examType, order, question, options, answer, explanation) {
  return { examType, order, question, type: 'mc', options, answer, explanation, points: 1 };
}

function writeCourse(relativePath, quizQuestions, questions) {
  const file = path.join(ROOT, relativePath);
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  course.quizQuestions = quizQuestions;
  course.questions = questions;
  fs.writeFileSync(file, `${JSON.stringify(course, null, 2)}\n`);
  console.log(`Updated ${relativePath}: ${quizQuestions.length} quiz questions, ${questions.length} exam questions`);
}

const csaQuiz = [
  qq(1, 1, 'What is the value of result after this code runs? int result = 7 / 2;', ['2', '3', '3.5', '4'], '3', 'Integer division drops the decimal part, so 7 / 2 evaluates to 3.'),
  qq(1, 2, 'Which declaration stores a decimal value most appropriately in Java?', ['int score = 98.6;', 'double score = 98.6;', 'boolean score = 98.6;', 'char score = 98.6;'], 'double score = 98.6;', 'double stores floating-point decimal values.'),
  qq(1, 3, 'What does casting do in this expression: (double) 5 / 2?', ['Changes 5 to a floating-point value before division', 'Rounds the answer to the nearest integer', 'Creates a String', 'Makes the code invalid'], 'Changes 5 to a floating-point value before division', 'Casting 5 to double makes the division floating-point, producing 2.5.'),
  qq(2, 1, 'Which String comparison is safest for checking same text content?', ['name == "Alan"', 'name.equals("Alan")', 'name = "Alan"', 'name.compareTo("Alan") > 10'], 'name.equals("Alan")', 'equals compares String contents; == compares object references.'),
  qq(2, 2, 'What does "computer".substring(0, 3) return?', ['com', 'comp', 'omp', 'put'], 'com', 'substring starts at index 0 and stops before index 3.'),
  qq(2, 3, 'What is true about String objects in Java?', ['They are mutable', 'They are immutable', 'They can only store one character', 'They cannot call methods'], 'They are immutable', 'String methods return new values; they do not change the original String.'),
  qq(3, 1, 'Which expression is true when x is between 10 and 20 inclusive?', ['x > 10 && x < 20', 'x >= 10 && x <= 20', 'x >= 10 || x <= 20', '10 <= x <= 20'], 'x >= 10 && x <= 20', 'Java requires two comparisons joined by && for an inclusive range.'),
  qq(3, 2, 'Why can short-circuit evaluation matter?', ['It makes all expressions false', 'It can skip evaluating the right side of && or ||', 'It converts booleans to integers', 'It only works with Strings'], 'It can skip evaluating the right side of && or ||', 'For &&, Java skips the right side if the left side is false; for ||, it skips if the left side is true.'),
  qq(3, 3, 'Which operator means logical NOT in Java?', ['!', '&&', '||', '!='], '!', '! reverses a boolean value. != means not equal.'),
  qq(4, 1, 'How many times does this loop run? for (int i = 0; i < 5; i++)', ['4', '5', '6', 'It never stops'], '5', 'i takes values 0, 1, 2, 3, and 4.'),
  qq(4, 2, 'Which loop is best when you do not know in advance how many repetitions are needed?', ['while loop', 'enhanced for loop only', 'import loop', 'class loop'], 'while loop', 'A while loop continues until its condition becomes false, useful for sentinel input or unknown repetition.'),
  qq(4, 3, 'What is a common cause of an infinite loop?', ['The condition eventually becomes false', 'The loop variable is never updated toward stopping', 'The loop has a body', 'The loop uses braces'], 'The loop variable is never updated toward stopping', 'If the condition never changes toward false, the loop can run forever.'),
  qq(5, 1, 'A nested loop with outer loop n times and inner loop n times usually performs about how many iterations?', ['n', '2n', 'n squared', 'log n'], 'n squared', 'The inner loop runs n times for each of n outer iterations.'),
  qq(5, 2, 'Which pattern is most natural for printing a grid of rows and columns?', ['A single if statement', 'Nested loops', 'A String comparison only', 'A constructor'], 'Nested loops', 'Rows and columns are a two-dimensional pattern, so nested loops fit naturally.'),
  qq(5, 3, 'What is an accumulator variable used for?', ['Storing a running total or combined result', 'Declaring a class', 'Stopping a method from returning', 'Changing a package name'], 'Storing a running total or combined result', 'An accumulator is updated repeatedly inside a loop.'),
  qq(6, 1, 'Which part of a method signature identifies the data a method receives?', ['Parameters', 'Comments', 'Package name', 'Import statements'], 'Parameters', 'Parameters define inputs passed into a method.'),
  qq(6, 2, 'What does a return type of void mean?', ['The method returns an int', 'The method returns no value', 'The method cannot be called', 'The method must be private'], 'The method returns no value', 'void methods perform actions but do not return a value.'),
  qq(6, 3, 'Why split code into methods?', ['To make code impossible to test', 'To organize behavior into reusable named units', 'To remove all variables', 'To avoid classes'], 'To organize behavior into reusable named units', 'Methods improve readability, reuse, testing, and decomposition.'),
  qq(7, 1, 'Why are instance variables usually private?', ['To support encapsulation and protect object state', 'Because private variables are faster', 'Because public variables cannot store data', 'Because constructors require it'], 'To support encapsulation and protect object state', 'Private fields prevent outside code from changing state without validation.'),
  qq(7, 2, 'What is the primary role of a constructor?', ['Initialize a new object', 'Delete an object', 'Sort an array', 'Start a loop'], 'Initialize a new object', 'A constructor sets up instance variables when an object is created.'),
  qq(7, 3, 'When is the keyword this most useful?', ['When a parameter name matches an instance variable name', 'Only inside static methods', 'Only when importing packages', 'When declaring arrays'], 'When a parameter name matches an instance variable name', 'this.field refers to the current object field, avoiding ambiguity.'),
  qq(8, 1, 'A static variable belongs to:', ['Each individual object only', 'The class itself', 'A method parameter', 'A local block only'], 'The class itself', 'static members are shared at the class level.'),
  qq(8, 2, 'Which is a good use of static?', ['A shared constant like Math.PI', 'A dog object name', 'A rectangle width unique to one rectangle', 'A student age unique to one student'], 'A shared constant like Math.PI', 'Class-level constants or utility methods are common static uses.'),
  qq(8, 3, 'Why is main declared static?', ['It must run before any object of the class is created', 'It changes every instance variable', 'It can only be used in abstract classes', 'It returns a boolean'], 'It must run before any object of the class is created', 'The JVM can call main without first constructing an object.'),
  qq(9, 1, 'What exception occurs when accessing arr[arr.length]?', ['NullPointerException', 'ArrayIndexOutOfBoundsException', 'ArithmeticException', 'No exception'], 'ArrayIndexOutOfBoundsException', 'The last valid index is arr.length - 1.'),
  qq(9, 2, 'What is true when an array is passed to a method?', ['A reference to the same array is passed', 'The array is always copied', 'The array becomes immutable', 'The method cannot change elements'], 'A reference to the same array is passed', 'Methods can modify the array elements through the shared reference.'),
  qq(9, 3, 'Which loop is best for visiting every value when indexes are not needed?', ['enhanced for loop', 'while(true) only', 'switch statement', 'constructor loop'], 'enhanced for loop', 'Enhanced for loops simplify reading each element without index logic.'),
  qq(10, 1, 'Which statement creates an ArrayList of Strings?', ['ArrayList<String> names = new ArrayList<String>();', 'String[] names = new ArrayList();', 'ArrayList<int> nums = new ArrayList<int>();', 'new String ArrayList names;'], 'ArrayList<String> names = new ArrayList<String>();', 'ArrayList uses object types as generic parameters.'),
  qq(10, 2, 'Which ArrayList method returns the element at index i?', ['get(i)', 'take(i)', 'index(i)', 'read(i)'], 'get(i)', 'get retrieves an element by index.'),
  qq(10, 3, 'How is ArrayList different from a normal array?', ['It can resize as elements are added or removed', 'It stores only primitive int values', 'It has no methods', 'It cannot be looped over'], 'It can resize as elements are added or removed', 'ArrayList is a resizable list backed by an array-like structure.'),
  qq(11, 1, 'In int[][] grid = new int[3][4], how many rows are there?', ['3', '4', '7', '12'], '3', 'The first dimension is the number of rows.'),
  qq(11, 2, 'What traversal visits each row completely before moving to the next row?', ['Column-major order', 'Row-major order', 'Random order', 'Binary order'], 'Row-major order', 'Row-major traversal loops rows outside and columns inside.'),
  qq(11, 3, 'Why are nested loops common with 2D arrays?', ['One loop controls rows and one controls columns', '2D arrays cannot use indexes', 'They automatically sort the array', 'They prevent all errors'], 'One loop controls rows and one controls columns', 'A 2D grid has two dimensions, so two loop variables are usually needed.'),
  qq(12, 1, 'Which keyword creates an inheritance relationship?', ['extends', 'inherits', 'parent', 'implementsClass'], 'extends', 'A subclass extends a superclass.'),
  qq(12, 2, 'What does method overriding allow?', ['A subclass provides its own version of an inherited method', 'A class deletes the superclass', 'A variable changes type randomly', 'A method runs without a name'], 'A subclass provides its own version of an inherited method', 'Overriding supports polymorphic behavior.'),
  qq(12, 3, 'What does polymorphism allow?', ['A superclass reference can refer to a subclass object', 'A primitive can call methods', 'A class can have no constructor', 'An array must be sorted'], 'A superclass reference can refer to a subclass object', 'Polymorphism lets code use a general type while executing subclass-specific methods.'),
  qq(13, 1, 'What must every recursive method have to stop correctly?', ['A base case', 'A static variable', 'A public field', 'A package statement'], 'A base case', 'The base case ends the recursion.'),
  qq(13, 2, 'What data structure concept is used to track recursive calls?', ['Call stack', 'Queue only', 'Hash table only', 'ArrayList only'], 'Call stack', 'Each recursive call gets its own stack frame.'),
  qq(13, 3, 'Which problem is naturally recursive?', ['Traversing a tree', 'Printing one fixed String', 'Declaring one int', 'Importing Scanner'], 'Traversing a tree', 'Trees are recursive structures: each subtree can be traversed the same way.'),
  qq(14, 1, 'What condition is required for binary search?', ['The data must be sorted', 'The array must be length 10', 'The values must all be Strings', 'The code must be recursive'], 'The data must be sorted', 'Binary search discards halves based on sorted order.'),
  qq(14, 2, 'Which sorting algorithm divides the array and merges sorted halves?', ['Merge sort', 'Selection sort', 'Linear search', 'Bubble scan'], 'Merge sort', 'Merge sort is a divide-and-conquer algorithm.'),
  qq(14, 3, 'What is the average time complexity of binary search?', ['O(1)', 'O(log n)', 'O(n)', 'O(n squared)'], 'O(log n)', 'Each comparison cuts the remaining search space roughly in half.'),
];

const csaQuestions = [
  exam('midterm', 1, 'What is printed by System.out.println(9 / 4);?', ['2', '2.25', '3', '4'], '2', 'Both operands are ints, so integer division truncates.'),
  exam('midterm', 2, 'Which expression correctly tests whether s equals "yes"?', ['s == "yes"', 's.equals("yes")', 's = "yes"', 'equals(s, "yes")'], 's.equals("yes")', 'equals compares String contents.'),
  exam('midterm', 3, 'What is the value of !(true && false)?', ['true', 'false', '0', 'It is invalid'], 'true', 'true && false is false; !false is true.'),
  exam('midterm', 4, 'A loop that reads values until the user types -1 is best described as:', ['sentinel-controlled', 'constructor-controlled', 'inheritance-controlled', 'compile-time only'], 'sentinel-controlled', 'A sentinel value signals when input should stop.'),
  exam('midterm', 5, 'A double nested loop over an n by n grid has which order of growth?', ['O(1)', 'O(log n)', 'O(n)', 'O(n squared)'], 'O(n squared)', 'There are n rows times n columns.'),
  exam('midterm', 6, 'Which method header returns an int and receives two int parameters?', ['public int add(int a, int b)', 'public void add(int a, int b)', 'public add int(a,b)', 'int public add()'], 'public int add(int a, int b)', 'The return type appears before the method name and parameters appear in parentheses.'),
  exam('midterm', 7, 'Why should a class validate constructor parameters?', ['To protect object invariants', 'To make all fields public', 'To avoid all methods', 'To force inheritance'], 'To protect object invariants', 'Validation prevents objects from starting in invalid states.'),
  exam('midterm', 8, 'What is the result of "desk".indexOf("s")?', ['0', '1', '2', '-1'], '2', 'String indexes start at 0: d=0, e=1, s=2.'),
  exam('midterm', 9, 'Which statement about local variables is true?', ['They exist only within their declared scope', 'They are automatically public', 'They belong to every object', 'They are always static'], 'They exist only within their declared scope', 'Local variables live inside a method or block.'),
  exam('midterm', 10, 'What is the output after int x = 4; x += 3;?', ['3', '4', '7', '12'], '7', 'x += 3 adds 3 to the current value.'),
  exam('midterm', 11, 'Which choice best describes encapsulation?', ['Hiding internal state and exposing controlled methods', 'Using no methods', 'Putting all code in main', 'Making every field public'], 'Hiding internal state and exposing controlled methods', 'Encapsulation controls access to object data.'),
  exam('midterm', 12, 'What makes an overloaded method different?', ['Same name, different parameter list', 'Same name, same parameter list', 'No return type', 'It must be private'], 'Same name, different parameter list', 'Overloading is based on different signatures.'),
  exam('midterm', 13, 'Which operator combines two boolean conditions and requires both to be true?', ['&&', '||', '!', '== for Strings'], '&&', '&& is logical AND.'),
  exam('midterm', 14, 'What is printed by for (int i=1; i<=3; i++) System.out.print(i);?', ['012', '123', '1234', '111'], '123', 'i starts at 1 and runs while i <= 3.'),
  exam('midterm', 15, 'Which code avoids a divide-by-zero error when d may be 0?', ['if (d != 0) result = n / d;', 'result = n / d; if (d != 0) {}', 'if (d = 0) result = 0;', 'result = d / n always'], 'if (d != 0) result = n / d;', 'Check the denominator before division.'),
  exam('final', 1, 'Which member is shared by all objects of a class?', ['static variable', 'instance variable', 'local variable', 'method parameter'], 'static variable', 'static belongs to the class, not each object.'),
  exam('final', 2, 'What is arr[0] in an array?', ['The first element', 'The last element', 'The length', 'The type'], 'The first element', 'Java arrays are zero-indexed.'),
  exam('final', 3, 'What does list.remove(2) do for an ArrayList?', ['Removes the element at index 2', 'Removes all elements equal to 2 always', 'Returns the length only', 'Sorts the list'], 'Removes the element at index 2', 'With an int argument, remove deletes the item at that index.'),
  exam('final', 4, 'In a 2D array grid[r][c], r usually represents:', ['row', 'column', 'method', 'class'], 'row', 'The first index is typically row.'),
  exam('final', 5, 'A subclass constructor often calls:', ['super(...)', 'parent.new()', 'extends(...)', 'static(...)'], 'super(...)', 'super calls a superclass constructor.'),
  exam('final', 6, 'If Animal a = new Dog(); a.speak(); and Dog overrides speak, which speak runs?', ['Dog speak', 'Animal speak always', 'No method runs', 'It is a compile error because Dog is not Animal'], 'Dog speak', 'Dynamic dispatch chooses the runtime object method.'),
  exam('final', 7, 'What happens if recursion has no reachable base case?', ['It can lead to stack overflow', 'It always returns 0', 'It becomes a loop automatically', 'It sorts the array'], 'It can lead to stack overflow', 'Recursive calls keep adding stack frames until memory is exhausted.'),
  exam('final', 8, 'Which search checks elements one by one?', ['linear search', 'binary search', 'merge sort', 'polymorphic search'], 'linear search', 'Linear search scans sequentially.'),
  exam('final', 9, 'Selection sort repeatedly:', ['selects the smallest remaining item and moves it into position', 'splits arrays in half', 'uses inheritance', 'requires a 2D array'], 'selects the smallest remaining item and moves it into position', 'Selection sort grows a sorted region by selecting the next smallest.'),
  exam('final', 10, 'Which is true about ArrayList<Integer>?', ['It stores Integer objects, not primitive int directly', 'It cannot change size', 'It cannot be looped over', 'It must be sorted'], 'It stores Integer objects, not primitive int directly', 'Generics require reference types; autoboxing bridges int and Integer.'),
  exam('final', 11, 'What is the purpose of @Override?', ['It asks the compiler to verify a method overrides a superclass method', 'It makes a field private', 'It imports a class', 'It starts recursion'], 'It asks the compiler to verify a method overrides a superclass method', '@Override catches signature mistakes.'),
  exam('final', 12, 'Which algorithm is usually O(n log n)?', ['merge sort', 'linear search', 'selection sort', 'array access'], 'merge sort', 'Merge sort divides and merges in O(n log n).'),
  exam('final', 13, 'Which is the best reason to use binary search over linear search?', ['It is faster on sorted large lists', 'It works on unsorted data', 'It never uses comparisons', 'It changes the array automatically'], 'It is faster on sorted large lists', 'Binary search is O(log n) but requires sorted data.'),
  exam('final', 14, 'What is true about private instance variables?', ['They can be accessed directly only inside the class', 'They are shared by all classes', 'They cannot store values', 'They are always static'], 'They can be accessed directly only inside the class', 'private restricts direct access to the declaring class.'),
  exam('final', 15, 'A recursive factorial method should return what for factorial(0)?', ['1', '0', '-1', 'It should recurse forever'], '1', '0! is 1 and commonly used as the base case.'),
  exam('final', 16, 'Which data structure principle describes a stack?', ['Last in, first out', 'First in, first out', 'Random in, random out', 'Sorted only'], 'Last in, first out', 'A stack removes the most recently added item first.'),
  exam('final', 17, 'What does grid.length return for a rectangular 2D array?', ['number of rows', 'number of columns', 'total cells', 'last value'], 'number of rows', 'The outer array length is the row count.'),
  exam('final', 18, 'Why might a method receive an array parameter?', ['To process or modify a collection of related values', 'To create a package', 'To prevent loops', 'To replace all classes'], 'To process or modify a collection of related values', 'Arrays group values so a method can work with all of them.'),
  exam('final', 19, 'Which phrase best defines abstraction?', ['Focusing on essential behavior while hiding unnecessary detail', 'Making all code public', 'Never using methods', 'Deleting comments'], 'Focusing on essential behavior while hiding unnecessary detail', 'Abstraction lets users rely on what an object does without knowing every implementation detail.'),
  exam('final', 20, 'Which AP CSA topic connects inheritance, overriding, and dynamic dispatch?', ['polymorphism', 'integer division', 'String immutability', 'array bounds'], 'polymorphism', 'Polymorphism depends on inheritance and overridden behavior.'),
];

const calcQuiz = [
  qq(1, 1, 'A function is continuous at x = a when:', ['f(a) exists, the limit exists, and they are equal', 'only f(a) exists', 'only the graph is increasing', 'the derivative is zero'], 'f(a) exists, the limit exists, and they are equal', 'Continuity at a point requires all three conditions.'),
  qq(1, 2, 'A jump discontinuity usually means:', ['the left and right limits are different', 'the function is a polynomial', 'the derivative is positive', 'the graph is always smooth'], 'the left and right limits are different', 'A jump occurs when the one-sided limits do not match.'),
  qq(1, 3, 'If a limit from the left and right are unequal, the two-sided limit:', ['does not exist', 'equals their average', 'equals zero', 'equals f(a)'], 'does not exist', 'A two-sided limit exists only when both one-sided limits agree.'),
  qq(2, 1, 'Which technique often resolves a 0/0 limit for rational expressions?', ['factoring and canceling', 'declaring the limit impossible immediately', 'using units', 'taking an antiderivative'], 'factoring and canceling', 'Algebraic simplification can remove a removable discontinuity.'),
  qq(2, 2, 'The Squeeze Theorem applies when:', ['a target function is trapped between two functions with the same limit', 'a function is always linear', 'a denominator is zero', 'a derivative is negative'], 'a target function is trapped between two functions with the same limit', 'If lower and upper bounds converge to L, the squeezed function also converges to L.'),
  qq(2, 3, 'What is an indeterminate form?', ['A form like 0/0 that needs more analysis', 'A final answer of zero', 'A function with no variables', 'A theorem about area'], 'A form like 0/0 that needs more analysis', '0/0 does not determine a limit by itself.'),
  qq(3, 1, 'The derivative at a point represents:', ['instantaneous rate of change', 'average value only', 'total area under a curve', 'the y-intercept'], 'instantaneous rate of change', 'The derivative is the limit of average rates over shrinking intervals.'),
  qq(3, 2, 'The difference quotient is used to define:', ['the derivative', 'the integral', 'the domain', 'a horizontal asymptote'], 'the derivative', 'The derivative is the limit of the difference quotient as h approaches 0.'),
  qq(3, 3, 'A tangent line slope at x = a is:', ["f'(a)", 'f(a)', 'a only', 'the area from 0 to a'], "f'(a)", 'The derivative value gives the tangent slope.'),
  qq(4, 1, 'What is d/dx of x^5?', ['5x^4', 'x^4', '5x^5', 'x^6/6'], '5x^4', 'The power rule gives n*x^(n-1).'),
  qq(4, 2, 'Which rule differentiates a product f(x)g(x)?', ['product rule', 'quotient rule', 'squeeze theorem', 'FTC'], 'product rule', 'The product rule is f prime g plus f g prime.'),
  qq(4, 3, 'What is the derivative of a constant?', ['0', '1', 'the constant', 'undefined always'], '0', 'A constant has no rate of change.'),
  qq(5, 1, 'The chain rule is mainly for:', ['composite functions', 'linear functions only', 'areas only', 'tables only'], 'composite functions', 'Differentiate the outside function and multiply by the derivative of the inside.'),
  qq(5, 2, 'Implicit differentiation is useful when:', ['y is not isolated as a function of x', 'there are no variables', 'the graph is a bar chart', 'all terms are constants'], 'y is not isolated as a function of x', 'Differentiate both sides with respect to x, treating y as a function of x.'),
  qq(5, 3, 'When differentiating y^2 with respect to x implicitly, the result is:', ['2y dy/dx', '2y', 'y^3/3', 'dy/dx only'], '2y dy/dx', 'By the chain rule, derivative of y^2 is 2y times dy/dx.'),
  qq(6, 1, 'What is d/dx of sin x?', ['cos x', '-sin x', '-cos x', 'tan x'], 'cos x', 'The derivative of sin x is cos x.'),
  qq(6, 2, 'What is d/dx of ln x?', ['1/x', 'x', 'ln x', 'e^x'], '1/x', 'The natural log derivative is 1/x for x > 0.'),
  qq(6, 3, 'What is d/dx of e^(3x)?', ['3e^(3x)', 'e^(3x)', '3x e^(3x)', 'e^3'], '3e^(3x)', 'Use the chain rule: derivative of 3x is 3.'),
  qq(7, 1, 'In related rates, when should known numerical values usually be substituted?', ['After differentiating', 'Before differentiating always', 'Only after graphing', 'Never'], 'After differentiating', 'Substituting too early can erase changing quantities.'),
  qq(7, 2, 'Related rates problems require differentiating with respect to:', ['time', 'area only', 'the final answer', 'a constant'], 'time', 'Rates such as dx/dt or dV/dt describe change over time.'),
  qq(7, 3, 'Why are units important in related rates?', ['They identify what rate the answer represents', 'They make derivatives unnecessary', 'They replace equations', 'They always equal zero'], 'They identify what rate the answer represents', 'A numerical rate needs units like cm/s or m^3/min.'),
  qq(8, 1, 'The Mean Value Theorem requires a function to be:', ['continuous on [a,b] and differentiable on (a,b)', 'differentiable only at endpoints', 'always positive', 'a polynomial only'], 'continuous on [a,b] and differentiable on (a,b)', 'These are the standard hypotheses of MVT.'),
  qq(8, 2, 'If f prime changes from positive to negative at c, f has a:', ['local maximum', 'local minimum', 'vertical asymptote', 'jump discontinuity'], 'local maximum', 'Increasing then decreasing indicates a local max.'),
  qq(8, 3, 'If f double-prime is positive, the graph is:', ['concave up', 'concave down', 'always decreasing', 'discontinuous'], 'concave up', 'Positive second derivative means slopes are increasing.'),
  qq(9, 1, 'Optimization problems usually start by defining:', ['an objective function and constraints', 'only a final answer', 'only a tangent line', 'a random table'], 'an objective function and constraints', 'You maximize or minimize an objective subject to constraints.'),
  qq(9, 2, 'An absolute maximum on a closed interval can occur:', ['at a critical point or endpoint', 'only where f is undefined', 'only at x=0', 'only at an inflection point'], 'at a critical point or endpoint', 'Closed interval optimization checks critical points and endpoints.'),
  qq(9, 3, 'Why check the domain in optimization?', ['It restricts possible meaningful answers', 'It removes all derivatives', 'It makes every answer positive', 'It replaces constraints'], 'It restricts possible meaningful answers', 'Real-world quantities often have boundaries such as positive length.'),
  qq(10, 1, 'A left Riemann sum uses:', ['left endpoints of subintervals', 'right endpoints only', 'derivatives only', 'zeros only'], 'left endpoints of subintervals', 'The sample point in each subinterval is its left endpoint.'),
  qq(10, 2, 'A definite integral can represent:', ['accumulated change or signed area', 'only a slope at one point', 'only a discontinuity', 'only an exponent'], 'accumulated change or signed area', 'Integrals accumulate quantities over an interval.'),
  qq(10, 3, 'The trapezoidal rule approximates area using:', ['trapezoids', 'circles', 'only tangent lines', 'recursive calls'], 'trapezoids', 'It averages left and right heights over each subinterval.'),
  qq(11, 1, 'FTC Part 2 evaluates definite integrals using:', ['antiderivatives', 'only graphs', 'only limits at infinity', 'only implicit differentiation'], 'antiderivatives', 'If F is an antiderivative of f, integral from a to b is F(b)-F(a).'),
  qq(11, 2, 'If F(x) = integral from 1 to x of f(t) dt, then F prime(x) is:', ['f(x)', 'f(1)', '0', 'x f(x)'], 'f(x)', 'FTC Part 1 says accumulation functions differentiate back to the integrand.'),
  qq(11, 3, 'What is an accumulation function?', ['A function defined by an integral with a variable limit', 'A list of constants', 'A derivative table', 'A discontinuity'], 'A function defined by an integral with a variable limit', 'It tracks accumulated area/change as the endpoint varies.'),
  qq(12, 1, 'In u-substitution, u is chosen to simplify:', ['a composite expression and its derivative', 'only the final answer', 'a table heading', 'the graph color'], 'a composite expression and its derivative', 'A good u makes du match another part of the integrand.'),
  qq(12, 2, 'For a definite integral, changing to u often requires:', ['changing the bounds', 'ignoring dx', 'making the answer negative', 'using product rule'], 'changing the bounds', 'Bounds in x should be converted to bounds in u if staying in u-space.'),
  qq(12, 3, 'u-substitution is the integration counterpart of:', ['the chain rule', 'the product rule', 'MVT', 'linear search'], 'the chain rule', 'Substitution reverses the chain rule.'),
  qq(13, 1, 'A slope field shows:', ['short line segments representing dy/dx at points', 'only exact solution formulas', 'areas under curves', 'Riemann rectangles'], 'short line segments representing dy/dx at points', 'Each segment shows the local slope of a differential equation.'),
  qq(13, 2, 'A separable differential equation lets you:', ['put y terms with dy and x terms with dx', 'avoid integration', 'differentiate only constants', 'ignore initial conditions'], 'put y terms with dy and x terms with dx', 'Separation prepares both sides for integration.'),
  qq(13, 3, 'An initial condition is used to:', ['find the particular solution constant', 'remove all variables', 'estimate a limit graphically', 'choose a sorting algorithm'], 'find the particular solution constant', 'After solving generally, plug in the initial point to determine C.'),
  qq(14, 1, 'Area between two curves is often computed by integrating:', ['top minus bottom', 'bottom minus top always', 'derivative only', 'zero over the interval'], 'top minus bottom', 'Vertical slices use upper function minus lower function.'),
  qq(14, 2, 'The washer method is used when:', ['a volume of revolution has a hole', 'a function is discontinuous', 'a graph has no area', 'a derivative is constant'], 'a volume of revolution has a hole', 'Washers subtract inner radius area from outer radius area.'),
  qq(14, 3, 'For known cross-sections, volume is:', ['integral of cross-sectional area', 'derivative of perimeter', 'limit of a String', 'always pi r squared'], 'integral of cross-sectional area', 'Volume accumulates slices: integrate A(x) dx.'),
];

const calcQuestions = [
  exam('midterm', 1, 'If lim x->2 f(x) = 5 and f(2) = 5, what condition is satisfied?', ['Continuity at x=2', 'A vertical asymptote', 'A jump discontinuity', 'No limit exists'], 'Continuity at x=2', 'The limit exists and equals the function value.'),
  exam('midterm', 2, 'Which form usually requires algebraic simplification before evaluating a limit?', ['0/0', '3/2', '5', 'infinity as a final finite value'], '0/0', '0/0 is indeterminate.'),
  exam('midterm', 3, 'The derivative definition uses the limit as h approaches:', ['0', '1', 'infinity', '-1 only'], '0', 'The interval width shrinks to zero.'),
  exam('midterm', 4, 'What is d/dx of 4x^3 - 2x?', ['12x^2 - 2', '4x^2 - 2', '12x^3 - 2', 'x^4 - x^2'], '12x^2 - 2', 'Apply the power rule term by term.'),
  exam('midterm', 5, 'The derivative of (x^2 + 1)^5 requires:', ['chain rule', 'Squeeze Theorem', 'Riemann sum', 'slope field'], 'chain rule', 'It is a composite function.'),
  exam('midterm', 6, 'For x^2 + y^2 = 25, implicit differentiation gives:', ['2x + 2y dy/dx = 0', '2x + 2y = 0', 'x + y = 25', 'dy/dx = 25'], '2x + 2y dy/dx = 0', 'Differentiate y^2 as 2y dy/dx.'),
  exam('midterm', 7, 'What is d/dx of cos x?', ['-sin x', 'sin x', 'cos x', '-cos x'], '-sin x', 'The derivative of cos x is -sin x.'),
  exam('midterm', 8, 'In related rates, a quantity such as dr/dt means:', ['radius changing with respect to time', 'area under radius', 'a constant radius', 'a limit law'], 'radius changing with respect to time', 'The notation describes rate of change over time.'),
  exam('midterm', 9, 'MVT guarantees a point where instantaneous rate equals:', ['average rate of change', 'the y-intercept', 'total area', 'zero always'], 'average rate of change', 'Under the hypotheses, f prime(c) equals the secant slope.'),
  exam('midterm', 10, 'If f prime is negative on an interval, f is:', ['decreasing', 'increasing', 'constant always', 'discontinuous always'], 'decreasing', 'A negative derivative means the function decreases.'),
  exam('midterm', 11, 'Which must be checked for closed interval absolute extrema?', ['critical points and endpoints', 'only endpoints', 'only inflection points', 'only x-intercepts'], 'critical points and endpoints', 'Absolute extrema can occur at interior critical points or interval endpoints.'),
  exam('midterm', 12, 'What does f double-prime help determine?', ['concavity', 'initial value only', 'String length', 'domain only'], 'concavity', 'The second derivative indicates concavity.'),
  exam('midterm', 13, 'The derivative of ln(x^2 + 1) is:', ['2x/(x^2 + 1)', '1/(x^2 + 1)', 'ln(2x)', '2x ln x'], '2x/(x^2 + 1)', 'Use chain rule: derivative of ln u is u prime/u.'),
  exam('midterm', 14, 'A removable discontinuity often appears as:', ['a hole', 'a vertical line through every point', 'a maximum only', 'an area'], 'a hole', 'A factor cancellation can reveal a hole in the graph.'),
  exam('midterm', 15, 'The product rule for f(x)g(x) is:', ["f'g + fg'", "f'g'", 'f/g', 'f+g only'], "f'g + fg'", 'Differentiate one factor at a time and add.'),
  exam('final', 1, 'A right Riemann sum uses which sample points?', ['right endpoints', 'left endpoints', 'only midpoints', 'critical points only'], 'right endpoints', 'Right sums use the right endpoint of each subinterval.'),
  exam('final', 2, 'The definite integral of velocity over time gives:', ['displacement', 'acceleration only', 'slope only', 'a discontinuity'], 'displacement', 'Integrating velocity accumulates change in position.'),
  exam('final', 3, 'FTC Part 1 says d/dx of integral from a to x f(t)dt equals:', ['f(x)', 'f(a)', '0', 'integral f(x)dx'], 'f(x)', 'Differentiating accumulation returns the integrand.'),
  exam('final', 4, 'What is integral of 2x dx?', ['x^2 + C', '2 + C', '2x + C', 'x + C'], 'x^2 + C', 'An antiderivative of 2x is x^2.'),
  exam('final', 5, 'u-substitution most directly reverses:', ['chain rule', 'quotient rule', 'MVT', 'curve sketching'], 'chain rule', 'Substitution handles integrals of composite functions.'),
  exam('final', 6, 'For integral 2x cos(x^2) dx, a good u is:', ['x^2', '2x', 'cos x', 'dx'], 'x^2', 'du = 2x dx appears in the integral.'),
  exam('final', 7, 'A slope field for dy/dx = y has slopes depending on:', ['y-value', 'area only', 'the final answer only', 'no variables'], 'y-value', 'The derivative formula uses y.'),
  exam('final', 8, 'Solving dy/dx = xy by separation starts with:', ['(1/y) dy = x dx', 'dy = x + y', 'dx/dy = xy only', 'y = x always'], '(1/y) dy = x dx', 'Separate y terms with dy and x terms with dx.'),
  exam('final', 9, 'Area between y=x and y=x^2 on [0,1] uses:', ['integral of x - x^2', 'integral of x^2 - x', 'derivative of x + x^2', 'zero because they intersect'], 'integral of x - x^2', 'On [0,1], x is above x^2.'),
  exam('final', 10, 'The disk method volume around the x-axis uses:', ['pi integral [f(x)]^2 dx', 'integral f prime dx only', '2 pi r h only', 'top minus bottom only'], 'pi integral [f(x)]^2 dx', 'Cross-sectional disks have area pi radius squared.'),
  exam('final', 11, 'A washer method problem subtracts:', ['inner radius squared from outer radius squared', 'left endpoint from right endpoint', 'derivative from integral', 'x from y always'], 'inner radius squared from outer radius squared', 'Washer area is pi(R^2 - r^2).'),
  exam('final', 12, 'An accumulation function is increasing where:', ['the integrand is positive', 'the integrand is negative', 'the upper limit is missing', 'the graph is blue'], 'the integrand is positive', 'F prime equals the integrand, so F increases where f is positive.'),
  exam('final', 13, 'What does a midpoint Riemann sum use?', ['midpoints of subintervals', 'only endpoints of the full interval', 'critical points only', 'zeros only'], 'midpoints of subintervals', 'Each rectangle height is sampled at the subinterval midpoint.'),
  exam('final', 14, 'If f prime changes from negative to positive at c, f has:', ['local minimum', 'local maximum', 'vertical asymptote', 'jump discontinuity'], 'local minimum', 'Decreasing then increasing indicates a local min.'),
  exam('final', 15, 'For optimization, the second derivative test helps:', ['classify maxima/minima', 'find domain only', 'make all functions continuous', 'avoid derivatives'], 'classify maxima/minima', 'Positive second derivative suggests local min; negative suggests local max.'),
  exam('final', 16, 'A separable differential equation with initial condition produces:', ['a particular solution', 'only a slope field', 'no constant', 'only a table'], 'a particular solution', 'The initial condition determines the integration constant.'),
  exam('final', 17, 'The integral from a to b of rate of change gives:', ['net change', 'average slope only', 'domain only', 'a tangent equation'], 'net change', 'This is the net change theorem.'),
  exam('final', 18, 'Which AP Calc concept links derivative and integral as inverse processes?', ['Fundamental Theorem of Calculus', 'Mean Value Theorem only', 'Squeeze Theorem only', 'Implicit differentiation'], 'Fundamental Theorem of Calculus', 'FTC connects accumulation and rates of change.'),
  exam('final', 19, 'A volume with square cross-sections perpendicular to x-axis is found by:', ['integrating side(x)^2 dx', 'differentiating area only', 'using binary search', 'using only endpoints'], 'integrating side(x)^2 dx', 'Each slice area is the square of its side length.'),
  exam('final', 20, 'Which expression is an antiderivative of cos x?', ['sin x + C', '-sin x + C', 'tan x + C', '1/x + C'], 'sin x + C', 'The derivative of sin x is cos x.'),
];

writeCourse('server/prisma/courses/electives/ap-computer-science-a.json', csaQuiz, csaQuestions);
writeCourse('server/prisma/courses/math/ap-calculus-ab.json', calcQuiz, calcQuestions);
