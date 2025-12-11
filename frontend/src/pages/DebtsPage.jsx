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
  InputRightElement,
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
import { formatINR } from '../utils/currency';

const DebtsPage = () => {
  const [debts, setDebts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    originalAmount: '',
    remainingBalance: '',
    interestRate: '',
    minimumPayment: '',
    nextPaymentDate: ''
  });

  const { token } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const redColor = useColorModeValue('red.500', 'red.300');
  const orangeColor = useColorModeValue('orange.500', 'orange.300');
  const modalBg = useColorModeValue('white', 'gray.800');

  // Fetch debts and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [debtsRes, categoriesRes] = await Promise.all([
          fetch('/api/debts', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (debtsRes.ok) {
          const debtsData = await debtsRes.json();
          setDebts(debtsData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.filter(cat => cat.type === 'debt'));
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

  // Calculate totals
  const totalDebtBalance = debts.reduce((sum, debt) => sum + debt.remainingBalance, 0);
  const totalOriginalDebt = debts.reduce((sum, debt) => sum + debt.originalAmount, 0);
  const totalPaidOff = totalOriginalDebt - totalDebtBalance;
  const payoffPercentage = totalOriginalDebt > 0 ? (totalPaidOff / totalOriginalDebt) * 100 : 0;
  const debtCount = debts.length;

  // Pagination logic
  const totalPages = Math.ceil(debts.length / itemsPerPage);
  const paginatedDebts = debts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      originalAmount: '',
      remainingBalance: '',
      interestRate: '',
      minimumPayment: '',
      nextPaymentDate: ''
    });
    setEditingDebt(null);
  };

  // Open modal for new debt
  const handleAddNew = () => {
    resetForm();
    onOpen();
  };

  // Open modal for editing
  const handleEdit = (debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      category: debt.category._id || debt.category,
      originalAmount: debt.originalAmount.toString(),
      remainingBalance: debt.remainingBalance.toString(),
      interestRate: debt.interestRate.toString(),
      minimumPayment: debt.minimumPayment?.toString() || '',
      nextPaymentDate: debt.nextPaymentDate
        ? new Date(debt.nextPaymentDate).toISOString().split('T')[0]
        : ''
    });
    onOpen();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingDebt
        ? `/api/debts/${editingDebt._id}`
        : '/api/debts';
      const method = editingDebt ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        category: formData.category,
        originalAmount: parseFloat(formData.originalAmount),
        remainingBalance: parseFloat(formData.remainingBalance),
        interestRate: parseFloat(formData.interestRate),
        minimumPayment: formData.minimumPayment ? parseFloat(formData.minimumPayment) : 0,
        nextPaymentDate: formData.nextPaymentDate || undefined
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save debt');
      }

      // Refresh debts list
      const debtsRes = await fetch('/api/debts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const debtsData = await debtsRes.json();
      setDebts(debtsData);

      toast({
        title: editingDebt ? 'Debt updated' : 'Debt added',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error saving debt',
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
      const response = await fetch(`/api/debts/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete debt');
      }

      setDebts(debts.filter((d) => d._id !== deleteId));

      toast({
        title: 'Debt deleted',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Error deleting debt',
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

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate individual debt payoff percentage
  const getPayoffProgress = (debt) => {
    const paid = debt.originalAmount - debt.remainingBalance;
    return debt.originalAmount > 0 ? (paid / debt.originalAmount) * 100 : 0;
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
        <Heading size="lg">Debts</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAddNew}>
          Add Debt
        </Button>
      </Flex>

      {/* Summary Cards */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6} mb={6}>
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Total Debt Balance</StatLabel>
                <StatNumber color={redColor} fontSize="3xl">
                  {formatINR(totalDebtBalance)}
                </StatNumber>
                <StatHelpText>Remaining to pay</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Total Paid Off</StatLabel>
                <StatNumber color="green.500" fontSize="3xl">
                  {formatINR(totalPaidOff)}
                </StatNumber>
                <StatHelpText>{payoffPercentage.toFixed(1)}% of original debt</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Number of Debts</StatLabel>
                <StatNumber fontSize="3xl">{debtCount}</StatNumber>
                <StatHelpText>Active debts tracked</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Overall Progress */}
      {totalOriginalDebt > 0 && (
        <Card bg={cardBg} border="1px" borderColor={borderColor} mb={6}>
          <CardBody>
            <Text fontWeight="medium" mb={2}>Overall Debt Payoff Progress</Text>
            <Progress
              value={payoffPercentage}
              colorScheme="green"
              size="lg"
              borderRadius="full"
            />
            <Text fontSize="sm" color={textColor} mt={2}>
              {formatINR(totalPaidOff)} paid of {formatINR(totalOriginalDebt)} total
            </Text>
          </CardBody>
        </Card>
      )}

      {/* Debts Table */}
      <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} overflow="hidden">
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th isNumeric>Balance</Th>
                <Th isNumeric>Interest Rate</Th>
                <Th>Progress</Th>
                <Th>Next Payment</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedDebts.length > 0 ? (
                paginatedDebts.map((debt) => (
                  <Tr key={debt._id}>
                    <Td fontWeight="medium">{debt.name}</Td>
                    <Td>{debt.category?.name || 'N/A'}</Td>
                    <Td isNumeric>
                      <Text color={redColor} fontWeight="semibold">
                        {formatINR(debt.remainingBalance)}
                      </Text>
                    </Td>
                    <Td isNumeric>
                      <Badge colorScheme={debt.interestRate > 15 ? 'red' : 'orange'}>
                        {debt.interestRate}%
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Progress
                          value={getPayoffProgress(debt)}
                          size="sm"
                          colorScheme="green"
                          width="100px"
                          borderRadius="full"
                        />
                        <Text fontSize="xs" color={textColor}>
                          {getPayoffProgress(debt).toFixed(0)}% paid
                        </Text>
                      </VStack>
                    </Td>
                    <Td>{formatDate(debt.nextPaymentDate)}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit debt"
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(debt)}
                        />
                        <IconButton
                          aria-label="Delete debt"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => confirmDelete(debt._id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={7}>
                    <Center py={8}>
                      <Text color={textColor}>No debts found. Great job staying debt-free!</Text>
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
              {Math.min(currentPage * itemsPerPage, debts.length)} of{' '}
              {debts.length} debts
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

      {/* Add/Edit Debt Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>
            {editingDebt ? 'Edit Debt' : 'Add New Debt'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Debt Name</FormLabel>
                  <Input
                    placeholder="e.g., Credit Card, Student Loan, Mortgage"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select
                    placeholder="Select category"
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
                  <FormLabel>Original Amount</FormLabel>
                  <InputGroup>
                    <InputLeftElement color={textColor}>₹</InputLeftElement>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.originalAmount}
                      onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Remaining Balance</FormLabel>
                  <InputGroup>
                    <InputLeftElement color={textColor}>₹</InputLeftElement>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.remainingBalance}
                      onChange={(e) => setFormData({ ...formData, remainingBalance: e.target.value })}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Interest Rate (APR)</FormLabel>
                  <InputGroup>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    />
                    <InputRightElement color={textColor}>%</InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel>Minimum Payment</FormLabel>
                  <InputGroup>
                    <InputLeftElement color={textColor}>₹</InputLeftElement>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.minimumPayment}
                      onChange={(e) => setFormData({ ...formData, minimumPayment: e.target.value })}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel>Next Payment Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.nextPaymentDate}
                    onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
                  />
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
                {editingDebt ? 'Update' : 'Add'} Debt
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
              Delete Debt
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this debt? This action cannot be undone.
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

export default DebtsPage;
