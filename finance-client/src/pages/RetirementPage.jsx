import { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Grid,
  GridItem,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  useColorModeValue,
  useToast,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Badge,
  Divider
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const RetirementPage = () => {
  const [formData, setFormData] = useState({
    currentSavings: '',
    annualContribution: '',
    annualReturn: '7',
    inflationRate: '3',
    yearsUntilRetirement: ''
  });
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { token } = useAuth();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const greenColor = useColorModeValue('green.500', 'green.300');
  const blueColor = useColorModeValue('blue.500', 'blue.300');
  const orangeColor = useColorModeValue('orange.500', 'orange.300');
  const purpleColor = useColorModeValue('purple.500', 'purple.300');

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/reports/simulations/retirement', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentSavings: parseFloat(formData.currentSavings),
          annualContribution: parseFloat(formData.annualContribution),
          annualReturn: parseFloat(formData.annualReturn),
          inflationRate: parseFloat(formData.inflationRate),
          yearsUntilRetirement: parseInt(formData.yearsUntilRetirement)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Simulation failed');
      }

      setResults(data);

      toast({
        title: 'Retirement simulation complete',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Simulation failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box bg={cardBg} p={3} borderRadius="md" border="1px" borderColor={borderColor} shadow="md">
          <Text fontWeight="bold" mb={2}>Year {label}</Text>
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" color={greenColor}>
              Inflation-Adjusted: {formatCurrency(payload[0]?.value)}
            </Text>
            <Text fontSize="sm" color={blueColor}>
              Nominal Value: {formatCurrency(payload[1]?.value)}
            </Text>
            <Text fontSize="sm" color={purpleColor}>
              Total Contributions: {formatCurrency(payload[2]?.value)}
            </Text>
          </VStack>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Retirement Planner
      </Heading>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 2fr' }} gap={6}>
        {/* Simulation Input Form */}
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Retirement Parameters</Heading>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={5}>
                  <FormControl isRequired>
                    <FormLabel>Current Retirement Savings</FormLabel>
                    <InputGroup>
                      <InputLeftElement color={textColor}>$</InputLeftElement>
                      <Input
                        type="number"
                        min="0"
                        placeholder="50000"
                        value={formData.currentSavings}
                        onChange={(e) =>
                          setFormData({ ...formData, currentSavings: e.target.value })
                        }
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Annual Contribution</FormLabel>
                    <InputGroup>
                      <InputLeftElement color={textColor}>$</InputLeftElement>
                      <Input
                        type="number"
                        min="0"
                        placeholder="12000"
                        value={formData.annualContribution}
                        onChange={(e) =>
                          setFormData({ ...formData, annualContribution: e.target.value })
                        }
                      />
                    </InputGroup>
                    <Text fontSize="xs" color={textColor} mt={1}>
                      How much you'll contribute each year
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Expected Annual Return</FormLabel>
                    <InputGroup>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="30"
                        placeholder="7"
                        value={formData.annualReturn}
                        onChange={(e) =>
                          setFormData({ ...formData, annualReturn: e.target.value })
                        }
                      />
                      <InputRightElement color={textColor}>%</InputRightElement>
                    </InputGroup>
                    <Text fontSize="xs" color={textColor} mt={1}>
                      Historical stock market average: ~7-10%
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Expected Inflation Rate</FormLabel>
                    <InputGroup>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        placeholder="3"
                        value={formData.inflationRate}
                        onChange={(e) =>
                          setFormData({ ...formData, inflationRate: e.target.value })
                        }
                      />
                      <InputRightElement color={textColor}>%</InputRightElement>
                    </InputGroup>
                    <Text fontSize="xs" color={textColor} mt={1}>
                      Historical average: ~2-3%
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Years Until Retirement</FormLabel>
                    <InputGroup>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        placeholder="25"
                        value={formData.yearsUntilRetirement}
                        onChange={(e) =>
                          setFormData({ ...formData, yearsUntilRetirement: e.target.value })
                        }
                      />
                      <InputRightElement color={textColor}>yrs</InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="green"
                    width="full"
                    isLoading={isLoading}
                    loadingText="Calculating..."
                  >
                    Calculate Retirement
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>
        </GridItem>

        {/* Results Display */}
        <GridItem>
          {results ? (
            <VStack spacing={6} align="stretch">
              {/* Projected Nest Egg - Prominent Display */}
              <Card bg={cardBg} border="2px" borderColor="green.400">
                <CardBody>
                  <VStack spacing={2}>
                    <Text fontSize="lg" color={textColor} fontWeight="medium">
                      Your Projected Retirement Nest Egg
                    </Text>
                    <Heading size="2xl" color={greenColor}>
                      {formatCurrency(results.projectedInflationAdjustedValue)}
                    </Heading>
                    <Text fontSize="sm" color={textColor}>
                      In today's dollars (inflation-adjusted)
                    </Text>
                    <Divider my={2} />
                    <HStack spacing={4}>
                      <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                        Nominal: {formatCurrency(results.projectedNominalValue)}
                      </Badge>
                      <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                        Real Return: {results.realRateOfReturn}%
                      </Badge>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Key Metrics */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Projection Details</Heading>
                    <Badge colorScheme="orange" fontSize="sm">
                      {results.inflationRate}% Inflation
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                    <Stat>
                      <StatLabel color={textColor}>Total Contributions</StatLabel>
                      <StatNumber color={purpleColor} fontSize="xl">
                        {formatCurrency(results.totalContributions)}
                      </StatNumber>
                      <StatHelpText>Over {results.yearsUntilRetirement} years</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel color={textColor}>Nominal Growth</StatLabel>
                      <StatNumber color={blueColor} fontSize="xl">
                        {formatCurrency(results.totalNominalGrowth)}
                      </StatNumber>
                      <StatHelpText>Before inflation adjustment</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel color={textColor}>Real Growth</StatLabel>
                      <StatNumber color={greenColor} fontSize="xl">
                        {formatCurrency(results.totalRealGrowth)}
                      </StatNumber>
                      <StatHelpText>Inflation-adjusted growth</StatHelpText>
                    </Stat>
                  </Grid>
                </CardBody>
              </Card>

              {/* Growth Chart */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Retirement Growth Over Time</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="400px">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={results.yearlyProjections}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="year"
                          label={{ value: 'Year', position: 'bottom', offset: 0 }}
                        />
                        <YAxis
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          label={{
                            value: 'Value ($)',
                            angle: -90,
                            position: 'insideLeft',
                            offset: 10
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} />
                        <Line
                          type="monotone"
                          dataKey="inflationAdjustedValue"
                          name="Inflation-Adjusted Value"
                          stroke="#38A169"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="nominalValue"
                          name="Nominal Value"
                          stroke="#3182CE"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalContributions"
                          name="Total Contributions"
                          stroke="#805AD5"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>

              {/* Inflation Impact */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Understanding Your Results</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <Box w={4} h={4} bg="green.500" borderRadius="sm" />
                      <Text>
                        <strong>Inflation-Adjusted Value:</strong> What your retirement savings will be worth in today's purchasing power.
                      </Text>
                    </HStack>
                    <HStack>
                      <Box w={4} h={4} bg="blue.500" borderRadius="sm" />
                      <Text>
                        <strong>Nominal Value:</strong> The actual dollar amount you'll have (without considering inflation).
                      </Text>
                    </HStack>
                    <HStack>
                      <Box w={4} h={4} bg="purple.500" borderRadius="sm" />
                      <Text>
                        <strong>Total Contributions:</strong> The total amount you'll contribute over the investment period.
                      </Text>
                    </HStack>
                    <Divider />
                    <Text fontSize="sm" color={orangeColor}>
                      💡 The gap between nominal and inflation-adjusted values shows how inflation erodes purchasing power over time.
                      Your real rate of return ({results.realRateOfReturn}%) accounts for this effect.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          ) : (
            <Card bg={cardBg} border="1px" borderColor={borderColor} height="full" minH="400px">
              <CardBody display="flex" alignItems="center" justifyContent="center">
                <VStack spacing={4} color={textColor}>
                  <Text fontSize="6xl">🏖️</Text>
                  <Heading size="md" textAlign="center">
                    Plan Your Retirement
                  </Heading>
                  <Text textAlign="center" maxW="md">
                    Enter your retirement parameters to see how your savings will grow over time,
                    with projections adjusted for inflation to show real purchasing power.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}
        </GridItem>
      </Grid>
    </Box>
  );
};

export default RetirementPage;
