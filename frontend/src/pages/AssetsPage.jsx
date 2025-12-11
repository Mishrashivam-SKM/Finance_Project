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
  GridItem
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';

const AssetsPage = () => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    currentValue: ''
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
  const modalBg = useColorModeValue('white', 'gray.800');

  // Fetch assets and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, categoriesRes] = await Promise.all([
          fetch('/api/assets', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (assetsRes.ok) {
          const assetsData = await assetsRes.json();
          setAssets(assetsData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.filter(cat => cat.type === 'asset'));
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
  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const assetCount = assets.length;

  // Pagination logic
  const totalPages = Math.ceil(assets.length / itemsPerPage);
  const paginatedAssets = assets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      currentValue: ''
    });
    setEditingAsset(null);
  };

  // Open modal for new asset
  const handleAddNew = () => {
    resetForm();
    onOpen();
  };

  // Open modal for editing
  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      category: asset.category._id || asset.category,
      currentValue: asset.currentValue.toString()
    });
    onOpen();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingAsset
        ? `/api/assets/${editingAsset._id}`
        : '/api/assets';
      const method = editingAsset ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          currentValue: parseFloat(formData.currentValue)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save asset');
      }

      // Refresh assets list
      const assetsRes = await fetch('/api/assets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const assetsData = await assetsRes.json();
      setAssets(assetsData);

      toast({
        title: editingAsset ? 'Asset updated' : 'Asset added',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error saving asset',
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
      const response = await fetch(`/api/assets/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }

      setAssets(assets.filter((a) => a._id !== deleteId));

      toast({
        title: 'Asset deleted',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Error deleting asset',
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
        <Heading size="lg">Assets</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAddNew}>
          Add Asset
        </Button>
      </Flex>

      {/* Summary Cards */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Total Asset Value</StatLabel>
                <StatNumber color={greenColor} fontSize="3xl">
                  {formatINR(totalAssetValue)}
                </StatNumber>
                <StatHelpText>Across all assets</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color={textColor}>Number of Assets</StatLabel>
                <StatNumber fontSize="3xl">{assetCount}</StatNumber>
                <StatHelpText>Total tracked assets</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Assets Table */}
      <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} overflow="hidden">
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th isNumeric>Current Value</Th>
                <Th>Last Updated</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedAssets.length > 0 ? (
                paginatedAssets.map((asset) => (
                  <Tr key={asset._id}>
                    <Td fontWeight="medium">{asset.name}</Td>
                    <Td>{asset.category?.name || 'N/A'}</Td>
                    <Td isNumeric>
                      <Text color={greenColor} fontWeight="semibold">
                        {formatINR(asset.currentValue)}
                      </Text>
                    </Td>
                    <Td>{formatDate(asset.lastUpdated || asset.updatedAt)}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit asset"
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(asset)}
                        />
                        <IconButton
                          aria-label="Delete asset"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => confirmDelete(asset._id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={5}>
                    <Center py={8}>
                      <Text color={textColor}>No assets found. Add your first asset!</Text>
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
              {Math.min(currentPage * itemsPerPage, assets.length)} of{' '}
              {assets.length} assets
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

      {/* Add/Edit Asset Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>
            {editingAsset ? 'Edit Asset' : 'Add New Asset'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Asset Name</FormLabel>
                  <Input
                    placeholder="e.g., Savings Account, House, Car"
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
                  <FormLabel>Current Value</FormLabel>
                  <InputGroup>
                    <InputLeftElement color={textColor}>₹</InputLeftElement>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.currentValue}
                      onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
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
                {editingAsset ? 'Update' : 'Add'} Asset
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
              Delete Asset
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this asset? This action cannot be undone.
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

export default AssetsPage;
