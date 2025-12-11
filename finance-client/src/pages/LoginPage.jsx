import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  useToast,
  useColorModeValue,
  Container,
  InputGroup,
  InputRightElement,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot password modal state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotToken, setForgotToken] = useState('');
  const { isOpen: isForgotOpen, onOpen: onForgotOpen, onClose: onForgotClose } = useDisclosure();

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || '/app/dashboard';

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!forgotEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setForgotLoading(true);

    try {
      const response = await fetch('/api/auth/forgotpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process request');
      }

      // Set success state and show token if available (for testing)
      setForgotSuccess(true);
      if (data.token) {
        setForgotToken(data.token);
      }

      toast({
        title: 'Request successful',
        description: 'Check backend console for reset token',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Request failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotClose = () => {
    setForgotEmail('');
    setForgotSuccess(false);
    setForgotToken('');
    onForgotClose();
  };

  const handleProceedToReset = () => {
    handleForgotClose();
    navigate('/resetpassword');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Call auth context login
      login(
        {
          _id: data._id,
          username: data.username,
          email: data.email,
          role: data.role
        },
        data.token
      );

      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.username}!`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      // Navigate to intended destination
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <Box
        bg={bgColor}
        p={8}
        borderRadius="lg"
        border="1px"
        borderColor={borderColor}
        boxShadow="lg"
      >
        <VStack spacing={6} align="stretch">
          <VStack spacing={2} textAlign="center">
            <Heading size="xl" color="blue.500">
              FinanceTracker
            </Heading>
            <Text color="gray.500">Sign in to your account</Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Box textAlign="right" width="full">
                <Link
                  as="button"
                  type="button"
                  onClick={onForgotOpen}
                  color="blue.500"
                  fontSize="sm"
                  fontWeight="medium"
                  _hover={{ textDecoration: 'underline' }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={isLoading}
                loadingText="Signing in..."
              >
                Sign In
              </Button>
            </VStack>
          </form>

          <Text textAlign="center">
            Don't have an account?{' '}
            <Link as={RouterLink} to="/register" color="blue.500" fontWeight="semibold">
              Sign up
            </Link>
          </Text>
        </VStack>
      </Box>

      {/* Forgot Password Modal */}
      <Modal isOpen={isForgotOpen} onClose={handleForgotClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reset Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!forgotSuccess ? (
              <VStack spacing={4} as="form" onSubmit={handleForgotPasswordSubmit}>
                <Text fontSize="sm" color="gray.600">
                  Enter your email address and we'll send you a password reset token.
                </Text>
                <FormControl isRequired>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </FormControl>
              </VStack>
            ) : (
              <VStack spacing={4} align="stretch">
                <Alert
                  status="success"
                  variant="subtle"
                  flexDirection="column"
                  alignItems="flex-start"
                  borderRadius="md"
                >
                  <HStack>
                    <AlertIcon />
                    <AlertTitle>Success!</AlertTitle>
                  </HStack>
                  <AlertDescription fontSize="sm" mt={2}>
                    A password reset token has been generated. Check the backend console for the token.
                  </AlertDescription>
                </Alert>

                {forgotToken && (
                  <Box
                    bg="gray.100"
                    p={3}
                    borderRadius="md"
                    border="1px"
                    borderColor="gray.300"
                    wordBreak="break-all"
                  >
                    <Text fontSize="xs" fontWeight="semibold" mb={1}>
                      Reset Token:
                    </Text>
                    <Text fontSize="xs" fontFamily="monospace">
                      {forgotToken}
                    </Text>
                  </Box>
                )}

                <Text fontSize="sm" color="gray.600">
                  You will need the token from the console and your email to reset your password.
                </Text>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            {!forgotSuccess ? (
              <>
                <Button variant="ghost" mr={3} onClick={handleForgotClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  isLoading={forgotLoading}
                  loadingText="Sending..."
                  onClick={handleForgotPasswordSubmit}
                >
                  Send Reset Token
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" mr={3} onClick={handleForgotClose}>
                  Close
                </Button>
                <Button colorScheme="blue" onClick={handleProceedToReset}>
                  Go to Reset Page
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default LoginPage;
