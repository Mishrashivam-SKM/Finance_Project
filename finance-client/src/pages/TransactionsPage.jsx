import { useState, useEffect } from 'react';
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
  Badge,
  Flex,
  InputGroup,
  InputLeftElement,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';
import { useRef } from 'react';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Filter states
  const [filterType, setFilterType] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const { token } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const modalBg = useColorModeValue('white', 'gray.800');

  // Fetch transactions and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transactionsRes, categoriesRes] = await Promise.all([
          fetch('/api/transactions', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          setTransactions(transactionsData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
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

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    let matches = true;

    if (filterType) {
      matches = matches && transaction.type === filterType;
    }

    if (filterStartDate) {
      matches = matches && new Date(transaction.date) >= new Date(filterStartDate);
    }

    if (filterEndDate) {
      matches = matches && new Date(transaction.date) <= new Date(filterEndDate);
    }

    return matches;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      type: 'expense',
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setEditingTransaction(null);
  };

  // Open modal for new transaction
  const handleAddNew = () => {
    resetForm();
    onOpen();
  };

  // Open modal for editing
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category._id || transaction.category,
      amount: transaction.amount.toString(),
      date: new Date(transaction.date).toISOString().split('T')[0],
      description: transaction.description || ''
    });
    onOpen();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingTransaction
        ? `/api/transactions/${editingTransaction._id}`
        : '/api/transactions';
      const method = editingTransaction ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save transaction');
      }

      // Refresh transactions list
      const transactionsRes = await fetch('/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData);

      toast({
        title: editingTransaction ? 'Transaction updated' : 'Transaction added',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error saving transaction',
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
      const response = await fetch(`/api/transactions/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      setTransactions(transactions.filter((t) => t._id !== deleteId));

      toast({
        title: 'Transaction deleted',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Error deleting transaction',
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
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <Heading size="lg">Transactions</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAddNew}>
          Add Transaction
        </Button>
      </Flex>

      {/* Filters */}
      <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor={borderColor} mb={6}>
        <HStack spacing={4} flexWrap="wrap">
          <FormControl maxW="200px">
            <FormLabel fontSize="sm">Type</FormLabel>
            <Select
              placeholder="All Types"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              size="sm"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
          </FormControl>

          <FormControl maxW="200px">
            <FormLabel fontSize="sm">Start Date</FormLabel>
            <Input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setCurrentPage(1);
              }}
              size="sm"
            />
          </FormControl>

          <FormControl maxW="200px">
            <FormLabel fontSize="sm">End Date</FormLabel>
            <Input
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setCurrentPage(1);
              }}
              size="sm"
            />
          </FormControl>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFilterType('');
              setFilterStartDate('');
              setFilterEndDate('');
              setCurrentPage(1);
            }}
            alignSelf="flex-end"
          >
            Clear Filters
          </Button>
        </HStack>
      </Box>

      {/* Transactions Table */}
      <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} overflow="hidden">
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Category</Th>
                <Th>Type</Th>
                <Th isNumeric>Amount</Th>
                <Th>Description</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((transaction) => (
                  <Tr key={transaction._id}>
                    <Td>{formatDate(transaction.date)}</Td>
                    <Td>{transaction.category?.name || 'N/A'}</Td>
                    <Td>
                      <Badge
                        colorScheme={transaction.type === 'income' ? 'green' : 'red'}
                      >
                        {transaction.type}
                      </Badge>
                    </Td>
                    <Td isNumeric fontWeight="semibold">
                      <Text color={transaction.type === 'income' ? 'green.500' : 'red.500'}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatINR(transaction.amount)}
                      </Text>
                    </Td>
                    <Td>
                      <Text noOfLines={1} maxW="150px">
                        {transaction.description || '-'}
                      </Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit transaction"
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(transaction)}
                        />
                        <IconButton
                          aria-label="Delete transaction"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => confirmDelete(transaction._id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={6}>
                    <Center py={8}>
                      <Text color={textColor}>No transactions found</Text>
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
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{' '}
              {filteredTransactions.length} transactions
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

      {/* Add/Edit Transaction Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>
            {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select
                    placeholder="Select category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories
                      .filter((cat) => cat.type === formData.type)
                      .map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Amount</FormLabel>
                  <InputGroup>
                    <InputLeftElement color={textColor}>₹</InputLeftElement>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Input
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                {editingTransaction ? 'Update' : 'Add'} Transaction
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
              Delete Transaction
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this transaction? This action cannot be undone.
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

export default TransactionsPage;
