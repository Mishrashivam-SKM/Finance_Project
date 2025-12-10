import {
  Box,
  Flex,
  VStack,
  Text,
  Link,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useColorModeValue
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Transactions', path: '/transactions' },
  { name: 'Assets', path: '/assets' },
  { name: 'Debts', path: '/debts' },
  { name: 'Budgets', path: '/budgets' },
  { name: 'Reports', path: '/reports' },
  { name: 'Simulations', path: '/simulations' }
];

const SidebarContent = ({ onClose }) => {
  const location = useLocation();
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <VStack align="stretch" spacing={1} p={4}>
      {navItems.map((item) => (
        <Link
          key={item.name}
          as={RouterLink}
          to={item.path}
          p={3}
          borderRadius="md"
          bg={location.pathname === item.path ? activeBg : 'transparent'}
          _hover={{ bg: hoverBg, textDecoration: 'none' }}
          onClick={onClose}
          fontWeight={location.pathname === item.path ? 'semibold' : 'normal'}
        >
          {item.name}
        </Link>
      ))}
    </VStack>
  );
};

const MainLayout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box minH="100vh">
      {/* Navbar */}
      <Flex
        as="nav"
        position="fixed"
        top={0}
        left={0}
        right={0}
        h="60px"
        bg={bgColor}
        borderBottom="1px"
        borderColor={borderColor}
        align="center"
        justify="space-between"
        px={4}
        zIndex={1000}
      >
        <Flex align="center">
          {/* Mobile menu button */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            variant="ghost"
            onClick={onOpen}
            mr={2}
          />
          {/* Logo */}
          <Text fontSize="xl" fontWeight="bold" color="blue.500">
            FinanceTracker
          </Text>
        </Flex>
        <ThemeToggle />
      </Flex>

      {/* Mobile Sidebar Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody p={0} mt={10}>
            <SidebarContent onClose={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Desktop Sidebar */}
      <Box
        display={{ base: 'none', md: 'block' }}
        position="fixed"
        top="60px"
        left={0}
        w="240px"
        h="calc(100vh - 60px)"
        bg={sidebarBg}
        borderRight="1px"
        borderColor={borderColor}
        overflowY="auto"
      >
        <SidebarContent onClose={() => {}} />
      </Box>

      {/* Main Content Area */}
      <Box
        ml={{ base: 0, md: '240px' }}
        mt="60px"
        p={6}
        minH="calc(100vh - 60px)"
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
