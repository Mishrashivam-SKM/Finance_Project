import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Spinner,
  Center,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Skeleton,
  SkeletonText
} from '@chakra-ui/react';
import { AddIcon, CalendarIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';

// Color palette for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

const DashboardPage = () => {
  const [netWorthData, setNetWorthData] = useState(null);
  const [spendingData, setSpendingData] = useState(null);
  const [savingTipData, setSavingTipData] = useState(null);
  const [isTipLoading, setIsTipLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const { token } = useAuth();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const positiveColor = useColorModeValue('green.500', 'green.300');
  const negativeColor = useColorModeValue('red.500', 'red.300');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Concurrent API calls
        const [netWorthResponse, spendingResponse] = await Promise.all([
          fetch('/api/reports/networth', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/reports/spending-breakdown', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (!netWorthResponse.ok || !spendingResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [netWorth, spending] = await Promise.all([
          netWorthResponse.json(),
          spendingResponse.json()
        ]);

        setNetWorthData(netWorth);
        setSpendingData(spending);
      } catch (error) {
        toast({
          title: 'Error loading dashboard',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, toast]);

  // Fetch AI saving tip separately (can take longer)
  useEffect(() => {
    const fetchSavingTip = async () => {
      try {
        const response = await fetch('/api/reports/saving-tips', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch saving tip');
        }

        const data = await response.json();
        setSavingTipData(data);
      } catch (error) {
        console.error('Error fetching saving tip:', error.message);
        // Don't show toast for tip error - it's not critical
      } finally {
        setIsTipLoading(false);
      }
    };

    fetchSavingTip();
  }, [token]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Prepare pie chart data
  const getPieChartData = () => {
    if (!spendingData?.breakdown || spendingData.breakdown.length === 0) {
      return [];
    }
    return spendingData.breakdown.map((item) => ({
      name: item.categoryName,
      value: item.totalSpent
    }));
  };

  if (isLoading) {
    return (
      <Center h="60vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color={textColor}>Loading dashboard...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Dashboard
      </Heading>

      {/* AI Finance Coach Tip Widget */}
      <Card bg={cardBg} border="1px" borderColor={borderColor} mb={6}>
        <CardHeader pb={2}>
          <HStack spacing={2}>
            <Text fontSize="2xl">💡</Text>
            <Heading size="md">AI Finance Coach Tip</Heading>
          </HStack>
        </CardHeader>
        <CardBody pt={2}>
          {isTipLoading ? (
            <VStack align="stretch" spacing={3}>
              <Skeleton height="20px" />
              <SkeletonText noOfLines={2} spacing={2} />
            </VStack>
          ) : savingTipData?.aiTip ? (
            <Alert
              status="info"
              variant="subtle"
              flexDirection="column"
              alignItems="flex-start"
              borderRadius="md"
              py={4}
            >
              <HStack mb={2}>
                <Text fontSize="xl">🤖</Text>
                <AlertTitle fontSize="md">Personalized Advice</AlertTitle>
              </HStack>
              <AlertDescription fontSize="md" lineHeight="tall">
                {savingTipData.aiTip}
              </AlertDescription>
              {savingTipData.expenses?.highestCategory && (
                <Text fontSize="sm" color={textColor} mt={3}>
                  Based on your spending: Highest category is{' '}
                  <strong>{savingTipData.expenses.highestCategory.name}</strong> at{' '}
                  {formatCurrency(savingTipData.expenses.highestCategory.amount)}
                </Text>
              )}
            </Alert>
          ) : (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <AlertDescription>
                Add more transactions to get personalized saving tips from our AI coach.
              </AlertDescription>
            </Alert>
          )}
        </CardBody>
      </Card>

      <Grid
        templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }}
        gap={6}
      >
        {/* Net Worth Card */}
        <GridItem colSpan={{ base: 1, lg: 2 }}>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Net Worth Overview</Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                <Stat>
                  <StatLabel color={textColor}>Total Assets</StatLabel>
                  <StatNumber color={positiveColor}>
                    {formatCurrency(netWorthData?.totalAssets || 0)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    Current value
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel color={textColor}>Total Debts</StatLabel>
                  <StatNumber color={negativeColor}>
                    {formatCurrency(netWorthData?.totalDebts || 0)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    Remaining balance
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel color={textColor}>Net Worth</StatLabel>
                  <StatNumber
                    color={
                      (netWorthData?.netWorth || 0) >= 0
                        ? positiveColor
                        : negativeColor
                    }
                  >
                    {formatCurrency(netWorthData?.netWorth || 0)}
                  </StatNumber>
                  <StatHelpText>Assets - Debts</StatHelpText>
                </Stat>
              </Grid>
            </CardBody>
          </Card>
        </GridItem>

        {/* Quick Actions Card */}
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor} h="full">
            <CardHeader>
              <Heading size="md">Quick Actions</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Button
                  as={RouterLink}
                  to="/transactions"
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  size="lg"
                >
                  Add Transaction
                </Button>
                <Button
                  as={RouterLink}
                  to="/budgets"
                  leftIcon={<CalendarIcon />}
                  colorScheme="green"
                  size="lg"
                  variant="outline"
                >
                  Set Budget
                </Button>
                <Button
                  as={RouterLink}
                  to="/assets"
                  colorScheme="purple"
                  size="lg"
                  variant="outline"
                >
                  Manage Assets
                </Button>
                <Button
                  as={RouterLink}
                  to="/debts"
                  colorScheme="orange"
                  size="lg"
                  variant="outline"
                >
                  Manage Debts
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Spending Breakdown Widget */}
        <GridItem colSpan={{ base: 1, lg: 3 }}>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Spending Breakdown</Heading>
                <Text color={textColor}>{spendingData?.month}</Text>
              </HStack>
            </CardHeader>
            <CardBody>
              {getPieChartData().length > 0 ? (
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                  <Box h="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                          labelLine={false}
                        >
                          {getPieChartData().map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>

                  <VStack align="stretch" spacing={3}>
                    <Box>
                      <Text color={textColor} fontSize="sm">
                        Total Spending This Month
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold" color={negativeColor}>
                        {formatCurrency(spendingData?.totalSpending || 0)}
                      </Text>
                    </Box>
                    <Divider />
                    <VStack align="stretch" spacing={2}>
                      {spendingData?.breakdown?.map((item, index) => (
                        <HStack key={item.categoryId} justify="space-between">
                          <HStack>
                            <Box
                              w={3}
                              h={3}
                              borderRadius="full"
                              bg={COLORS[index % COLORS.length]}
                            />
                            <Text fontSize="sm">{item.categoryName}</Text>
                          </HStack>
                          <Text fontSize="sm" fontWeight="semibold">
                            {formatCurrency(item.totalSpent)}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </Grid>
              ) : (
                <Center h="200px">
                  <VStack spacing={2}>
                    <Text color={textColor}>No spending data for this month</Text>
                    <Button
                      as={RouterLink}
                      to="/transactions"
                      colorScheme="blue"
                      size="sm"
                    >
                      Add your first transaction
                    </Button>
                  </VStack>
                </Center>
              )}
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
