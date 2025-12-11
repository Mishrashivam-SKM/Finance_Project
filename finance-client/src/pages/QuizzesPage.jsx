import { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Radio,
  RadioGroup,
  Progress,
  Badge,
  useColorModeValue,
  useToast,
  Spinner,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Divider,
  Select,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'Debt', label: 'Debt' },
  { value: 'Investing', label: 'Investing' },
  { value: 'Budgeting', label: 'Budgeting' },
  { value: 'Saving', label: 'Saving' },
  { value: 'Tax Planning', label: 'Tax Planning' },
  { value: 'Retirement', label: 'Retirement' },
  { value: 'General', label: 'General' }
];

const QuizzesPage = () => {
  const [quizState, setQuizState] = useState('idle'); // idle, loading, active, submitting, completed
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  const { token } = useAuth();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const greenColor = useColorModeValue('green.500', 'green.300');
  const redColor = useColorModeValue('red.500', 'red.300');
  const blueColor = useColorModeValue('blue.500', 'blue.300');
  const optionBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const correctAnswerBg = useColorModeValue('green.50', 'green.900');
  const incorrectAnswerBg = useColorModeValue('red.50', 'red.900');

  // Start quiz
  const startQuiz = async () => {
    setQuizState('loading');
    try {
      const url = selectedCategory
        ? `/api/quizzes/start?category=${selectedCategory}`
        : '/api/quizzes/start';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch quiz questions');
      }

      setQuestions(data.questions);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setResults(null);
      setQuizState('active');
    } catch (error) {
      toast({
        title: 'Failed to start quiz',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setQuizState('idle');
    }
  };

  // Submit quiz
  const submitQuiz = async () => {
    setQuizState('submitting');
    try {
      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex: parseInt(selectedIndex)
      }));

      const response = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: formattedAnswers })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit quiz');
      }

      setResults(data);
      setQuizState('completed');

      toast({
        title: 'Quiz completed!',
        description: `You scored ${data.score} out of ${data.totalQuestions}`,
        status: data.scorePercentage >= 70 ? 'success' : 'info',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Failed to submit quiz',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setQuizState('active');
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId, selectedIndex) => {
    setAnswers({
      ...answers,
      [questionId]: selectedIndex
    });
  };

  // Navigation
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Check if all questions answered
  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  // Get score color
  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'green';
    if (percentage >= 60) return 'yellow';
    return 'red';
  };

  // Render idle state (start screen)
  const renderIdleState = () => (
    <Card bg={cardBg} border="1px" borderColor={borderColor} maxW="lg" mx="auto">
      <CardHeader>
        <VStack spacing={2}>
          <Text fontSize="5xl">📚</Text>
          <Heading size="lg" textAlign="center">Financial Literacy Quiz</Heading>
        </VStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4}>
          <Text textAlign="center" color={textColor}>
            Test your financial knowledge with 10 random questions.
            Learn about debt management, investing, budgeting, and more!
          </Text>
          <FormControl>
            <FormLabel>Select Category (Optional)</FormLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </FormControl>
        </VStack>
      </CardBody>
      <CardFooter>
        <Button colorScheme="blue" size="lg" width="full" onClick={startQuiz}>
          Start Quiz
        </Button>
      </CardFooter>
    </Card>
  );

  // Render loading state
  const renderLoadingState = () => (
    <Card bg={cardBg} border="1px" borderColor={borderColor} maxW="lg" mx="auto">
      <CardBody>
        <VStack spacing={4} py={10}>
          <Spinner size="xl" color="blue.500" />
          <Text color={textColor}>Loading quiz questions...</Text>
        </VStack>
      </CardBody>
    </Card>
  );

  // Render active quiz
  const renderActiveQuiz = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const answeredCount = Object.keys(answers).length;

    return (
      <VStack spacing={6} align="stretch">
        {/* Progress Header */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={3}>
              <HStack justify="space-between" width="full">
                <Text fontWeight="medium">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Text>
                <Badge colorScheme="blue">
                  {answeredCount}/{questions.length} Answered
                </Badge>
              </HStack>
              <Progress
                value={progress}
                size="sm"
                colorScheme="blue"
                width="full"
                borderRadius="full"
              />
            </VStack>
          </CardBody>
        </Card>

        {/* Question Card */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between">
              <Badge colorScheme="purple">{currentQuestion.category}</Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Text fontSize="xl" fontWeight="medium">
                {currentQuestion.questionText}
              </Text>

              <RadioGroup
                value={answers[currentQuestion._id]?.toString() || ''}
                onChange={(value) => handleAnswerSelect(currentQuestion._id, value)}
              >
                <VStack spacing={3} align="stretch">
                  {currentQuestion.options.map((option, index) => (
                    <Box
                      key={index}
                      p={4}
                      borderRadius="md"
                      border="1px"
                      borderColor={
                        answers[currentQuestion._id]?.toString() === index.toString()
                          ? 'blue.400'
                          : borderColor
                      }
                      bg={
                        answers[currentQuestion._id]?.toString() === index.toString()
                          ? selectedBg
                          : optionBg
                      }
                      cursor="pointer"
                      onClick={() => handleAnswerSelect(currentQuestion._id, index.toString())}
                      _hover={{ borderColor: 'blue.300' }}
                      transition="all 0.2s"
                    >
                      <Radio value={index.toString()} colorScheme="blue">
                        <Text ml={2}>{option}</Text>
                      </Radio>
                    </Box>
                  ))}
                </VStack>
              </RadioGroup>
            </VStack>
          </CardBody>
          <CardFooter>
            <HStack justify="space-between" width="full">
              <Button
                onClick={goToPreviousQuestion}
                isDisabled={currentQuestionIndex === 0}
                variant="outline"
              >
                Previous
              </Button>
              <HStack>
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button colorScheme="blue" onClick={goToNextQuestion}>
                    Next
                  </Button>
                ) : (
                  <Button
                    colorScheme="green"
                    onClick={submitQuiz}
                    isDisabled={!allAnswered}
                    isLoading={quizState === 'submitting'}
                  >
                    Submit Quiz
                  </Button>
                )}
              </HStack>
            </HStack>
          </CardFooter>
        </Card>

        {/* Question Navigator */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={3}>
              <Text fontWeight="medium" color={textColor}>
                Question Navigator
              </Text>
              <HStack flexWrap="wrap" justify="center" spacing={2}>
                {questions.map((q, index) => (
                  <Button
                    key={q._id}
                    size="sm"
                    variant={currentQuestionIndex === index ? 'solid' : 'outline'}
                    colorScheme={answers[q._id] !== undefined ? 'green' : 'gray'}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    );
  };

  // Render results
  const renderResults = () => {
    if (!results) return null;

    return (
      <VStack spacing={6} align="stretch">
        {/* Score Card */}
        <Card bg={cardBg} border="2px" borderColor={`${getScoreColor(results.scorePercentage)}.400`}>
          <CardBody>
            <VStack spacing={4}>
              <Icon
                as={results.scorePercentage >= 60 ? CheckCircleIcon : WarningIcon}
                boxSize={16}
                color={`${getScoreColor(results.scorePercentage)}.500`}
              />
              <Heading size="lg">Quiz Completed!</Heading>
              <Grid templateColumns="repeat(3, 1fr)" gap={6} width="full">
                <Stat textAlign="center">
                  <StatLabel color={textColor}>Score</StatLabel>
                  <StatNumber color={`${getScoreColor(results.scorePercentage)}.500`}>
                    {results.score}/{results.totalQuestions}
                  </StatNumber>
                  <StatHelpText>Correct Answers</StatHelpText>
                </Stat>
                <Stat textAlign="center">
                  <StatLabel color={textColor}>Percentage</StatLabel>
                  <StatNumber color={`${getScoreColor(results.scorePercentage)}.500`}>
                    {results.scorePercentage}%
                  </StatNumber>
                  <StatHelpText>
                    {results.scorePercentage >= 80 ? 'Excellent!' :
                     results.scorePercentage >= 60 ? 'Good job!' : 'Keep learning!'}
                  </StatHelpText>
                </Stat>
                <Stat textAlign="center">
                  <StatLabel color={textColor}>Incorrect</StatLabel>
                  <StatNumber color={redColor}>
                    {results.totalQuestions - results.score}
                  </StatNumber>
                  <StatHelpText>To review</StatHelpText>
                </Stat>
              </Grid>
              <Button colorScheme="blue" size="lg" onClick={() => setQuizState('idle')}>
                Take Another Quiz
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Review Answers */}
        <Heading size="md">Review Your Answers</Heading>
        {results.results.map((result, index) => (
          <Card
            key={result.questionId}
            bg={cardBg}
            border="1px"
            borderColor={result.isCorrect ? 'green.400' : 'red.400'}
          >
            <CardHeader>
              <HStack justify="space-between">
                <HStack>
                  <Badge colorScheme={result.isCorrect ? 'green' : 'red'}>
                    {result.isCorrect ? 'Correct' : 'Incorrect'}
                  </Badge>
                  <Badge colorScheme="purple">{result.category}</Badge>
                </HStack>
                <Text color={textColor}>Question {index + 1}</Text>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Text fontWeight="medium">{result.questionText}</Text>
                <Divider />
                <VStack align="stretch" spacing={2}>
                  {result.options.map((option, optIndex) => {
                    const isSelected = result.selectedIndex === optIndex;
                    const isCorrect = result.correctAnswerIndex === optIndex;

                    let bgColor = optionBg;
                    let borderCol = borderColor;

                    if (isCorrect) {
                      bgColor = correctAnswerBg;
                      borderCol = 'green.400';
                    } else if (isSelected && !isCorrect) {
                      bgColor = incorrectAnswerBg;
                      borderCol = 'red.400';
                    }

                    return (
                      <Box
                        key={optIndex}
                        p={3}
                        borderRadius="md"
                        border="1px"
                        borderColor={borderCol}
                        bg={bgColor}
                      >
                        <HStack justify="space-between">
                          <Text>{option}</Text>
                          <HStack>
                            {isSelected && (
                              <Badge colorScheme={isCorrect ? 'green' : 'red'}>
                                Your answer
                              </Badge>
                            )}
                            {isCorrect && (
                              <Badge colorScheme="green">
                                Correct answer
                              </Badge>
                            )}
                          </HStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </VStack>
    );
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Financial Quiz
      </Heading>

      {quizState === 'idle' && renderIdleState()}
      {quizState === 'loading' && renderLoadingState()}
      {(quizState === 'active' || quizState === 'submitting') && renderActiveQuiz()}
      {quizState === 'completed' && renderResults()}
    </Box>
  );
};

export default QuizzesPage;
