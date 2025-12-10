import { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
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
  Divider,
  Badge
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { useAuth } from '../context/AuthContext';

// Risk profile defaults
const RISK_PROFILES = {
  low: { label: 'Low Risk', return: 4, description: 'Conservative investments (bonds, savings)' },
  medium: { label: 'Medium Risk', return: 7, description: 'Balanced portfolio (mixed stocks/bonds)' },
  high: { label: 'High Risk', return: 10, description: 'Aggressive investments (stocks, growth funds)' }
};

const SimulationPage = () => {
  const [formData, setFormData] = useState({
    initialInvestment: '',
    monthlyContribution: '',
    annualReturn: '7',
    years: ''
  });
  const [riskProfile, setRiskProfile] = useState('medium');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { token } = useAuth();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const greenColor = useColorModeValue('green.500', 'green.300');
  const blueColor = useColorModeValue('blue.500', 'blue.300');
  const purpleColor = useColorModeValue('purple.500', 'purple.300');

  // Handle risk profile change
  const handleRiskChange = (profile) => {
    setRiskProfile(profile);
    setFormData({
      ...formData,
      annualReturn: RISK_PROFILES[profile].return.toString()
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/reports/simulations/investment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          initialInvestment: parseFloat(formData.initialInvestment),
          monthlyContribution: parseFloat(formData.monthlyContribution),
          annualReturn: parseFloat(formData.annualReturn),
          years: parseInt(formData.years)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Simulation failed');
      }

      setResults(data);

      toast({
        title: 'Simulation complete',
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
            <Text fontSize="sm" color={blueColor}>
              Total Value: {formatCurrency(payload[0]?.value)}
            </Text>
            <Text fontSize="sm" color={greenColor}>
              Contributions: {formatCurrency(payload[1]?.value)}
            </Text>
            <Text fontSize="sm" color={purpleColor}>
              Interest: {formatCurrency(payload[2]?.value)}
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
        Investment Simulator
      </Heading>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 2fr' }} gap={6}>
        {/* Simulation Input Form */}
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Simulation Parameters</Heading>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={5}>
                  {/* Risk Profile Selection */}
                  <FormControl>
                    <FormLabel>Risk Profile</FormLabel>
                    <Select
                      value={riskProfile}
                      onChange={(e) => handleRiskChange(e.target.value)}
                    >
                      {Object.entries(RISK_PROFILES).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.label} (~{value.return}% return)
                        </option>
                      ))}
                    </Select>
                    <Text fontSize="xs" color={textColor} mt={1}>
                      {RISK_PROFILES[riskProfile].description}
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Initial Investment</FormLabel>
                    <InputGroup>
                      <InputLeftElement color={textColor}>$</InputLeftElement>
                      <Input
                        type="number"
                        min="0"
                        placeholder="10000"
                        value={formData.initialInvestment}
                        onChange={(e) =>
                          setFormData({ ...formData, initialInvestment: e.target.value })
                        }
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Monthly Contribution</FormLabel>
                    <InputGroup>
                      <InputLeftElement color={textColor}>$</InputLeftElement>
                      <Input
                        type="number"
                        min="0"
                        placeholder="500"
                        value={formData.monthlyContribution}
                        onChange={(e) =>
                          setFormData({ ...formData, monthlyContribution: e.target.value })
                        }
                      />
                    </InputGroup>
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
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Investment Period (Years)</FormLabel>
                    <InputGroup>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        placeholder="20"
                        value={formData.years}
                        onChange={(e) =>
                          setFormData({ ...formData, years: e.target.value })
                        }
                      />
                      <InputRightElement color={textColor}>yrs</InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    isLoading={isLoading}
                    loadingText="Calculating..."
                  >
                    Run Simulation
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
              {/* Key Metrics */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Projection Results</Heading>
                    <Badge colorScheme="green" fontSize="sm">
                      {results.annualReturn}% Annual Return
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                    <Stat>
                      <StatLabel color={textColor}>Final Value</StatLabel>
                      <StatNumber color={blueColor} fontSize="2xl">
                        {formatCurrency(results.finalValue)}
                      </StatNumber>
                      <StatHelpText>After {results.years} years</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel color={textColor}>Total Contributions</StatLabel>
                      <StatNumber color={greenColor} fontSize="2xl">
                        {formatCurrency(results.totalContributions)}
                      </StatNumber>
                      <StatHelpText>Principal invested</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel color={textColor}>Total Interest Earned</StatLabel>
                      <StatNumber color={purpleColor} fontSize="2xl">
                        {formatCurrency(results.totalInterestEarned)}
                      </StatNumber>
                      <StatHelpText>
                        {((results.totalInterestEarned / results.totalContributions) * 100).toFixed(0)}% gain
                      </StatHelpText>
                    </Stat>
                  </Grid>
                </CardBody>
              </Card>

              {/* Chart */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Growth Projection</Heading>
                </CardHeader>
                <CardBody>
                  <Box h="400px">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={results.yearlyProjections}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="year"
                          label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            new Intl.NumberFormat('en-US', {
                              notation: 'compact',
                              compactDisplay: 'short',
                              style: 'currency',
                              currency: 'USD'
                            }).format(value)
                          }
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="value"
                          name="Total Value"
                          stroke="#3182CE"
                          fill="#3182CE"
                          fillOpacity={0.3}
                        />
                        <Area
                          type="monotone"
                          dataKey="totalContributions"
                          name="Contributions"
                          stroke="#38A169"
                          fill="#38A169"
                          fillOpacity={0.3}
                        />
                        <Area
                          type="monotone"
                          dataKey="interestEarned"
                          name="Interest Earned"
                          stroke="#805AD5"
                          fill="#805AD5"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>

              {/* Yearly Breakdown Table */}
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Yearly Breakdown</Heading>
                </CardHeader>
                <CardBody>
                  <Box maxH="300px" overflowY="auto">
                    <Grid templateColumns="repeat(4, 1fr)" gap={2} fontSize="sm">
                      <Text fontWeight="bold" color={textColor}>Year</Text>
                      <Text fontWeight="bold" color={textColor}>Value</Text>
                      <Text fontWeight="bold" color={textColor}>Contributions</Text>
                      <Text fontWeight="bold" color={textColor}>Interest</Text>
                      
                      {results.yearlyProjections.map((projection) => (
                        <>
                          <Text key={`year-${projection.year}`}>{projection.year}</Text>
                          <Text key={`value-${projection.year}`} color={blueColor}>
                            {formatCurrency(projection.value)}
                          </Text>
                          <Text key={`contrib-${projection.year}`} color={greenColor}>
                            {formatCurrency(projection.totalContributions)}
                          </Text>
                          <Text key={`interest-${projection.year}`} color={purpleColor}>
                            {formatCurrency(projection.interestEarned)}
                          </Text>
                        </>
                      ))}
                    </Grid>
                  </Box>
                </CardBody>
              </Card>
            </VStack>
          ) : (
            <Card bg={cardBg} border="1px" borderColor={borderColor} h="full" minH="400px">
              <CardBody display="flex" alignItems="center" justifyContent="center">
                <VStack spacing={4} textAlign="center">
                  <Text fontSize="lg" color={textColor}>
                    Enter your investment parameters and run the simulation
                  </Text>
                  <Text fontSize="sm" color={textColor}>
                    See how your investments could grow over time with compound interest
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

export default SimulationPage;
