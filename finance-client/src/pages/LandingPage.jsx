import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  SimpleGrid,
  Icon,
  VStack,
  HStack,
  useColorModeValue,
  Card,
  CardBody,
  Badge,
  Divider,
  Link as ChakraLink
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import {
  FiTrendingUp,
  FiDollarSign,
  FiPieChart,
  FiTarget,
  FiAward,
  FiBarChart2,
  FiCreditCard,
  FiShield,
  FiZap
} from 'react-icons/fi';
import { FaRobot, FaChartLine, FaCalculator, FaUmbrella } from 'react-icons/fa';

const LandingPage = () => {
  // Theme colors
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');
  const accentColor = useColorModeValue('blue.600', 'blue.400');
  const featureBg = useColorModeValue('blue.50', 'blue.900');
  const footerBg = useColorModeValue('gray.100', 'gray.900');

  // Feature data
  const coreFeatures = [
    {
      icon: FiPieChart,
      title: 'Smart Budgeting',
      description: 'Create and track monthly budgets across multiple expense categories. Get real-time alerts when approaching budget limits and visualize spending patterns with interactive charts.',
      color: 'blue'
    },
    {
      icon: FiTrendingUp,
      title: 'Investment Simulation',
      description: 'Model different investment strategies with our advanced Monte Carlo simulator. Test various asset allocations and time horizons to plan your financial future with confidence.',
      color: 'green'
    },
    {
      icon: FiDollarSign,
      title: 'Net Worth Tracking',
      description: 'Monitor your complete financial picture by tracking assets, liabilities, and transactions. Watch your net worth grow over time with comprehensive reporting and analytics.',
      color: 'purple'
    }
  ];

  const advancedFeatures = [
    {
      icon: FaRobot,
      title: 'AI Finance Coach',
      description: 'Get personalized financial advice powered by advanced AI. Receive tailored saving tips, spending insights, and actionable recommendations based on your unique financial situation.',
      gradient: 'linear(to-r, cyan.400, blue.500)',
      badge: 'AI-Powered'
    },
    {
      icon: FaUmbrella,
      title: 'Retirement Simulator',
      description: 'Plan for your future with our comprehensive retirement calculator. Model different scenarios, adjust savings rates, and visualize your retirement readiness with detailed projections.',
      gradient: 'linear(to-r, purple.400, pink.500)',
      badge: 'Premium Feature'
    }
  ];

  const additionalFeatures = [
    { icon: FiTarget, text: 'Goal-based savings tracking' },
    { icon: FiBarChart2, text: 'Detailed financial reports' },
    { icon: FiCreditCard, text: 'Debt management tools' },
    { icon: FiShield, text: 'Bank-level security' },
    { icon: FiZap, text: 'Real-time updates' },
    { icon: FiAward, text: 'Financial literacy quizzes' }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bgGradient={bgGradient}
        pt={{ base: 20, md: 32 }}
        pb={{ base: 16, md: 24 }}
        px={4}
      >
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Badge
              colorScheme="blue"
              fontSize="md"
              px={4}
              py={2}
              borderRadius="full"
            >
              Your Personal Finance Command Center
            </Badge>
            
            <Heading
              as="h1"
              size={{ base: '2xl', md: '3xl', lg: '4xl' }}
              fontWeight="bold"
              color={headingColor}
              lineHeight="shorter"
            >
              FinanceGuide: Master Your Money
            </Heading>
            
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              color={textColor}
              maxW="3xl"
              lineHeight="tall"
            >
              Take control of your financial future with intelligent budgeting, investment
              simulations, and AI-powered insights. Track, analyze, and optimize your wealth
              all in one place.
            </Text>

            <HStack spacing={4} pt={4}>
              <Button
                as={RouterLink}
                to="/register"
                size="lg"
                colorScheme="blue"
                px={8}
                py={6}
                fontSize="lg"
                leftIcon={<Icon as={FiZap} />}
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                transition="all 0.2s"
              >
                Get Started Free
              </Button>
              <Button
                as={RouterLink}
                to="/login"
                size="lg"
                variant="outline"
                colorScheme="blue"
                px={8}
                py={6}
                fontSize="lg"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                transition="all 0.2s"
              >
                Log In
              </Button>
            </HStack>

            <HStack spacing={8} pt={8} fontSize="sm" color={textColor}>
              <HStack>
                <Icon as={FiShield} />
                <Text>Secure & Private</Text>
              </HStack>
              <HStack>
                <Icon as={FiZap} />
                <Text>Real-time Sync</Text>
              </HStack>
              <HStack>
                <Icon as={FaChartLine} />
                <Text>Advanced Analytics</Text>
              </HStack>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Core Features Section */}
      <Box py={{ base: 16, md: 24 }} px={4}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading
                as="h2"
                size={{ base: 'xl', md: '2xl' }}
                color={headingColor}
              >
                Everything You Need to Succeed
              </Heading>
              <Text fontSize="lg" color={textColor} maxW="2xl">
                Powerful features designed to help you manage, grow, and protect your wealth
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
              {coreFeatures.map((feature, index) => (
                <Card
                  key={index}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="xl"
                  overflow="hidden"
                  transition="all 0.3s"
                  _hover={{
                    transform: 'translateY(-8px)',
                    boxShadow: '2xl',
                    borderColor: accentColor
                  }}
                >
                  <CardBody p={8}>
                    <VStack spacing={4} align="start">
                      <Flex
                        w={16}
                        h={16}
                        align="center"
                        justify="center"
                        borderRadius="xl"
                        bg={`${feature.color}.100`}
                        color={`${feature.color}.600`}
                      >
                        <Icon as={feature.icon} boxSize={8} />
                      </Flex>
                      <Heading as="h3" size="md" color={headingColor}>
                        {feature.title}
                      </Heading>
                      <Text color={textColor} lineHeight="tall">
                        {feature.description}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Advanced Features Callout */}
      <Box bg={featureBg} py={{ base: 16, md: 24 }} px={4}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Badge colorScheme="purple" fontSize="md" px={4} py={2} borderRadius="full">
                Advanced Intelligence
              </Badge>
              <Heading
                as="h2"
                size={{ base: 'xl', md: '2xl' }}
                color={headingColor}
              >
                Powered by AI & Advanced Analytics
              </Heading>
              <Text fontSize="lg" color={textColor} maxW="2xl">
                Go beyond basic tracking with cutting-edge features that set FinanceGuide apart
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
              {advancedFeatures.map((feature, index) => (
                <Card
                  key={index}
                  bg={cardBg}
                  borderWidth="2px"
                  borderColor={borderColor}
                  borderRadius="2xl"
                  overflow="hidden"
                  position="relative"
                  transition="all 0.3s"
                  _hover={{
                    transform: 'scale(1.02)',
                    boxShadow: '2xl'
                  }}
                >
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    h={1}
                    bgGradient={feature.gradient}
                  />
                  <CardBody p={8}>
                    <VStack spacing={5} align="start">
                      <HStack justify="space-between" w="full">
                        <Flex
                          w={16}
                          h={16}
                          align="center"
                          justify="center"
                          borderRadius="xl"
                          bgGradient={feature.gradient}
                          color="white"
                        >
                          <Icon as={feature.icon} boxSize={8} />
                        </Flex>
                        <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                          {feature.badge}
                        </Badge>
                      </HStack>
                      <Heading as="h3" size="lg" color={headingColor}>
                        {feature.title}
                      </Heading>
                      <Text color={textColor} fontSize="md" lineHeight="tall">
                        {feature.description}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Additional Features Grid */}
      <Box py={{ base: 16, md: 24 }} px={4}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <Heading
              as="h2"
              size={{ base: 'xl', md: '2xl' }}
              color={headingColor}
              textAlign="center"
            >
              And Much More...
            </Heading>

            <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={6} w="full">
              {additionalFeatures.map((feature, index) => (
                <Card
                  key={index}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                  textAlign="center"
                  transition="all 0.2s"
                  _hover={{
                    borderColor: accentColor,
                    boxShadow: 'md'
                  }}
                >
                  <CardBody p={6}>
                    <VStack spacing={3}>
                      <Icon
                        as={feature.icon}
                        boxSize={8}
                        color={accentColor}
                      />
                      <Text fontSize="sm" color={textColor} fontWeight="medium">
                        {feature.text}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Box bg={featureBg} py={{ base: 16, md: 20 }} px={4}>
        <Container maxW="container.md">
          <Card
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="2xl"
            overflow="hidden"
          >
            <CardBody p={{ base: 8, md: 12 }}>
              <VStack spacing={6} textAlign="center">
                <Icon as={FaCalculator} boxSize={12} color={accentColor} />
                <Heading as="h2" size="xl" color={headingColor}>
                  Ready to Take Control?
                </Heading>
                <Text fontSize="lg" color={textColor} maxW="lg">
                  Join thousands of users who are already mastering their finances with
                  FinanceGuide. Start your journey to financial freedom today.
                </Text>
                <HStack spacing={4} pt={4}>
                  <Button
                    as={RouterLink}
                    to="/register"
                    size="lg"
                    colorScheme="blue"
                    px={8}
                    leftIcon={<Icon as={FiZap} />}
                  >
                    Start Free Today
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/login"
                    size="lg"
                    variant="ghost"
                    colorScheme="blue"
                  >
                    Sign In
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg={footerBg} py={8} px={4} borderTopWidth="1px" borderColor={borderColor}>
        <Container maxW="container.xl">
          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing={{ base: 4, md: 8 }}
            justify="space-between"
            align="center"
          >
            <VStack align={{ base: 'center', md: 'start' }} spacing={2}>
              <Heading size="md" color={headingColor}>
                FinanceGuide
              </Heading>
              <Text fontSize="sm" color={textColor}>
                &copy; {new Date().getFullYear()} FinanceGuide. All rights reserved.
              </Text>
            </VStack>

            <HStack spacing={6} fontSize="sm">
              <ChakraLink
                as={RouterLink}
                to="/register"
                color={textColor}
                _hover={{ color: accentColor }}
              >
                Get Started
              </ChakraLink>
              <Divider orientation="vertical" h={4} />
              <ChakraLink
                as={RouterLink}
                to="/login"
                color={textColor}
                _hover={{ color: accentColor }}
              >
                Login
              </ChakraLink>
              <Divider orientation="vertical" h={4} />
              <ChakraLink
                href="#"
                color={textColor}
                _hover={{ color: accentColor }}
              >
                Privacy Policy
              </ChakraLink>
              <Divider orientation="vertical" h={4} />
              <ChakraLink
                href="#"
                color={textColor}
                _hover={{ color: accentColor }}
              >
                Terms of Service
              </ChakraLink>
            </HStack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
