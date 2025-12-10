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
  Textarea,
  Switch,
  useDisclosure,
  useToast,
  useColorModeValue,
  Spinner,
  Center,
  Text,
  Badge,
  Flex,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  InputGroup,
  InputLeftElement,
  Icon
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, SearchIcon, WarningIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

// Tip categories
const TIP_CATEGORIES = [
  'Budgeting',
  'Investing',
  'Debt Management',
  'Saving',
  'Tax Planning'
];

const AdminTipsPage = () => {
  const [tips, setTips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: '',
    isPublished: true
  });

  const { token, user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const forbiddenBg = useColorModeValue('red.50', 'red.900');

  // Check admin role
  if (user?.role !== 'admin') {
    return (
      <Center h="60vh">
        <VStack
          spacing={6}
          p={10}
          bg={forbiddenBg}
          borderRadius="xl"
          border="1px"
          borderColor="red.300"
        >
          <Icon as={WarningIcon} boxSize={16} color="red.500" />
          <Heading size="2xl" color="red.500">
            403 Forbidden
          </Heading>
          <Text fontSize="lg" color={textColor} textAlign="center">
            You do not have permission to access this page.
            <br />
            Admin privileges are required.
          </Text>
        </VStack>
      </Center>
    );
  }

  // Fetch tips
  useEffect(() => {
    const fetchTips = async () => {
      try {
        const response = await fetch('/api/admin/tips', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setTips(data);
        } else {
          throw new Error('Failed to fetch tips');
        }
      } catch (error) {
        toast({
          title: 'Error loading tips',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTips();
  }, [token, toast]);

  // Filter tips
  const filteredTips = tips.filter((tip) => {
    let matches = true;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matches = matches && (
        tip.title.toLowerCase().includes(query) ||
        tip.body.toLowerCase().includes(query)
      );
    }

    if (filterCategory) {
      matches = matches && tip.category === filterCategory;
    }

    return matches;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      body: '',
      category: '',
      isPublished: true
    });
    setEditingTip(null);
  };

  // Open modal for new tip
  const handleAddNew = () => {
    resetForm();
    onOpen();
  };

  // Open modal for editing
  const handleEdit = (tip) => {
    setEditingTip(tip);
    setFormData({
      title: tip.title,
      body: tip.body,
      category: tip.category,
      isPublished: tip.isPublished
    });
    onOpen();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingTip
        ? `/api/admin/tips/${editingTip._id}`
        : '/api/admin/tips';
      const method = editingTip ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save tip');
      }

      // Refresh tips list
      const tipsRes = await fetch('/api/admin/tips', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tipsData = await tipsRes.json();
      setTips(tipsData);

      toast({
        title: editingTip ? 'Tip updated' : 'Tip created',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error saving tip',
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
      const response = await fetch(`/api/admin/tips/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete tip');
      }

      setTips(tips.filter((t) => t._id !== deleteId));

      toast({
        title: 'Tip deleted',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Error deleting tip',
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
        <VStack align="start" spacing={1}>
          <Heading size="lg">Manage Financial Tips</Heading>
          <Text color={textColor}>Create and manage tips for users</Text>
        </VStack>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAddNew}>
          Add New Tip
        </Button>
      </Flex>

      {/* Filters */}
      <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor={borderColor} mb={6}>
        <HStack spacing={4} flexWrap="wrap">
          <FormControl maxW="300px">
            <InputGroup>
              <InputLeftElement>
                <SearchIcon color={textColor} />
              </InputLeftElement>
              <Input
                placeholder="Search tips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </FormControl>

          <FormControl maxW="200px">
            <Select
              placeholder="All Categories"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {TIP_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="ghost"
            onClick={() => {
              setSearchQuery('');
              setFilterCategory('');
            }}
          >
            Clear Filters
          </Button>
        </HStack>
      </Box>

      {/* Tips Table */}
      <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} overflow="hidden">
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Category</Th>
                <Th>Status</Th>
                <Th>Created By</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredTips.length > 0 ? (
                filteredTips.map((tip) => (
                  <Tr key={tip._id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" noOfLines={1}>
                          {tip.title}
                        </Text>
                        <Text fontSize="sm" color={textColor} noOfLines={1}>
                          {tip.body.substring(0, 60)}...
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme="purple">{tip.category}</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={tip.isPublished ? 'green' : 'gray'}>
                        {tip.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color={textColor}>
                        {tip.adminId?.username || 'Unknown'}
                      </Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit tip"
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(tip)}
                        />
                        <IconButton
                          aria-label="Delete tip"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => confirmDelete(tip._id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={5}>
                    <Center py={8}>
                      <Text color={textColor}>No tips found</Text>
                    </Center>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {/* Add/Edit Tip Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingTip ? 'Edit Tip' : 'Add New Tip'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input
                    placeholder="Enter tip title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select
                    placeholder="Select category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {TIP_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Body</FormLabel>
                  <Textarea
                    placeholder="Enter tip content..."
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={6}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>Published</FormLabel>
                  <Switch
                    isChecked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublished: e.target.checked })
                    }
                    colorScheme="green"
                  />
                  <Text ml={2} fontSize="sm" color={textColor}>
                    {formData.isPublished ? 'Visible to users' : 'Draft mode'}
                  </Text>
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
                {editingTip ? 'Update' : 'Create'} Tip
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
              Delete Tip
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this tip? This action cannot be undone.
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

export default AdminTipsPage;
