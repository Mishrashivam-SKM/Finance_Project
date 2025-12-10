import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  HStack,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useDisclosure,
  useToast,
  useColorModeValue,
  Spinner,
  Center,
  Text,
  Flex,
  InputGroup,
  InputLeftElement,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Progress,
  Badge
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [formData, setFormData] = useState({
    category: '',
    periodStart: new Date().toISOString().slice(0, 7) + '-01',
    limitAmount: ''
  });

  const { token } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const greenColor = useColorModeValue('green.500', 'green.300');
  const redColor = useColorModeValue('red.500', 'red.300');
  const orangeColor = useColorModeValue('orange.500', 'orange.300');

  // Fetch budgets, categories, and transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [budgetsRes, categoriesRes, transactionsRes] = await Promise.all([
          fetch('/api/budgets', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/transactions', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (budgetsRes.ok) {
          const budgetsData = await budgetsRes.json();
          setBudgets(budgetsData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.filter(cat => cat.type === 'expense'));
        }

        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          setTransactions(transactionsData);
        }
      } catch (error) {
        toast({
          title: 'Error loading data',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, toast]);

  // Calculate spending for a budget category in its period
  const getSpentAmount = (budget) => {
    const periodStart = new Date(budget.periodStart);
    const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0, 23, 59, 59);

    const categoryId = budget.category._id || budget.category;

    return transactions
      .filter(t => {
        const transDate = new Date(t.date);
        const transCategoryId = t.category._id || t.category;
        return (
          t.type === 'expense' &&
          transCategoryId === categoryId &&
          transDate >= periodStart &&
          transDate <= periodEnd
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Calculate totals
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + getSpentAmount(b), 0);
  const totalRemaining = totalBudgetLimit - totalSpent;
  const budgetCount = budgets.length;

  // Pagination logic
  const totalPages = Math.ceil(budgets.length / itemsPerPage);
  const paginatedBudgets = budgets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      category: '',
      periodStart: new Date().toISOString().slice(0, 7) + '-01',
      limitAmount: ''
    });
    setEditingBudget(null);
  };

  // Open modal for new budget
  const handleAddNew = () => {
    resetForm();
    onOpen();
  };

  // Open modal for editing
  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category._id || budget.category,
      periodStart: new Date(budget.periodStart).toISOString().split('T')[0],
      limitAmount: budget.limitAmount.toString()
    });
    onOpen();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingBudget
        ? `/api/budgets/${editingBudget._id}`
        : '/api/budgets';
      const method = editingBudget ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: formData.category,
          periodStart: formData.periodStart,
          limitAmount: parseFloat(formData.limitAmount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save budget');
      }

      // Refresh budgets list
      const budgetsRes = await fetch('/api/budgets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const budgetsData = await budgetsRes.json();
      setBudgets(budgetsData);

      toast({
        title: editingBudget ? 'Budget updated' : 'Budget added',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error saving budget',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/budgets/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }

      setBudgets(budgets.filter((b) => b._id !== deleteId));

      toast({
        title: 'Budget deleted',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Error deleting budget',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      onDeleteClose();
      setDeleteId(null);
    }
  };

  // Confirm delete
  const confirmDelete = (id) => {
    setDeleteId(id);
    onDeleteOpen();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format month
  const formatMonth = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Get budget status
  const getBudgetStatus = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return { color: 'red', label: 'Over Budget' };
    if (percentage >= 80) return { color: 'orange', label: 'Near Limit' };
    return { color: 'green', label: 'On Track' };
  };

  // Get progress color scheme
  const getProgressColorScheme = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return 'red';
    if (percentage >= 80) return 'orange';
    return 'green';
  };

  if (isLoading) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Budgets</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAddNew}>
          Add Budget
        </Button>
      </Flex>

      {/* Summary Cards */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6} mb={6}>
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Total Budget</StatLabel>
                <StatNumber fontSize="2xl">
                  {formatCurrency(totalBudgetLimit)}
                </StatNumber>
                <StatHelpText>Monthly limit</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Total Spent</StatLabel>
                <StatNumber color={totalSpent > totalBudgetLimit ? redColor : orangeColor} fontSize="2xl">
                  {formatCurrency(totalSpent)}
                </StatNumber>
                <StatHelpText>
                  {totalBudgetLimit > 0 ? `${((totalSpent / totalBudgetLimit) * 100).toFixed(0)}% used` : 'No budget set'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Remaining</StatLabel>
                <StatNumber color={totalRemaining >= 0 ? greenColor : redColor} fontSize="2xl">
                  {formatCurrency(Math.abs(totalRemaining))}
                </StatNumber>
                <StatHelpText>{totalRemaining >= 0 ? 'Left to spend' : 'Over budget'}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Active Budgets</StatLabel>
                <StatNumber fontSize="2xl">{budgetCount}</StatNumber>
                <StatHelpText>Categories tracked</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Budgets Table */}
      <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} overflow="hidden">
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Category</Th>
                <Th>Period</Th>
                <Th isNumeric>Budget Limit</Th>
                <Th isNumeric>Spent</Th>
                <Th>Progress</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedBudgets.length > 0 ? (
                paginatedBudgets.map((budget) => {
                  const spent = getSpentAmount(budget);
                  const remaining = budget.limitAmount - spent;
                  const percentage = (spent / budget.limitAmount) * 100;
                  const status = getBudgetStatus(spent, budget.limitAmount);

                  return (
                    <Tr key={budget._id}>
                      <Td fontWeight="medium">{budget.category?.name || 'N/A'}</Td>
                      <Td>{formatMonth(budget.periodStart)}</Td>
                      <Td isNumeric>{formatCurrency(budget.limitAmount)}</Td>
                      <Td isNumeric>
                        <Text color={spent > budget.limitAmount ? redColor : 'inherit'}>
                          {formatCurrency(spent)}
                        </Text>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Progress
                            value={Math.min(percentage, 100)}
                            size="sm"
                            colorScheme={getProgressColorScheme(spent, budget.limitAmount)}
                            width="100px"
                            borderRadius="full"
                          />
                          <Text fontSize="xs" color={textColor}>
                            {percentage.toFixed(0)}% used
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={status.color}>
                          {status.label}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit budget"
                            icon={<EditIcon />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(budget)}
                          />
                          <IconButton
                            aria-label="Delete budget"
                            icon={<DeleteIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => confirmDelete(budget._id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                  <Td colSpan={7}>
                    <Center py={8}>
                      <Text color={textColor}>No budgets found. Create your first budget!</Text>
                    </Center>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" p={4} borderTop="1px" borderColor={borderColor}>
            <Text color={textColor} fontSize="sm">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, budgets.length)} of{' '}
              {budgets.length} budgets
            </Text>
            <HStack>
              <Button
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                isDisabled={currentPage === 1}
              >
                Previous
              </Button>
              <Text fontSize="sm">
                Page {currentPage} of {totalPages}
              </Text>
              <Button
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                isDisabled={currentPage === totalPages}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        )}
      </Box>

      {/* Add/Edit Budget Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingBudget ? 'Edit Budget' : 'Add New Budget'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select
                    placeholder="Select expense category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Budget Period (Month)</FormLabel>
                  <Input
                    type="month"
                    value={formData.periodStart.slice(0, 7)}
                    onChange={(e) => setFormData({ ...formData, periodStart: e.target.value + '-01' })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Budget Limit</FormLabel>
                  <InputGroup>
                    <InputLeftElement color={textColor}>$</InputLeftElement>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.limitAmount}
                      onChange={(e) => setFormData({ ...formData, limitAmount: e.target.value })}
                    />
                  </InputGroup>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={isSubmitting}
                loadingText="Saving..."
              >
                {editingBudget ? 'Update' : 'Add'} Budget
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Budget
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this budget? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default BudgetsPage;
