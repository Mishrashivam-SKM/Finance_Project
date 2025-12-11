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
  useColorModeValue,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { HamburgerIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { name: 'Dashboard', path: '/app/dashboard' },
  { name: 'Transactions', path: '/app/transactions' },
  { name: 'Assets', path: '/app/assets' },
  { name: 'Debts', path: '/app/debts' },
  { name: 'Budgets', path: '/app/budgets' },
  { name: 'Quizzes', path: '/app/quizzes' },
  { name: 'Retirement', path: '/app/retirement' },
  { name: 'Simulations', path: '/app/simulations' },
  { name: 'Profile', path: '/app/profile' }
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

const MainLayout = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
        px={{ base: 3, md: 4 }}
        zIndex={1000}
      >
        <Flex align="center" gap={2}>
          {/* Mobile menu button */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            variant="ghost"
            size="sm"
            onClick={onOpen}
          />
          {/* Logo */}
          <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="blue.500" isTruncated>
            FinanceTracker
          </Text>
        </Flex>
        <Flex align="center" gap={2}>
          <ThemeToggle />
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="ghost"
              size="sm"
              fontSize={{ base: 'xs', md: 'sm' }}
            >
              {user?.username ? user.username.substring(0, 8) : 'Menu'}
            </MenuButton>
            <MenuList>
              <MenuItem as={RouterLink} to="/app/profile">
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout} color="red.500">
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
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
        w={{ md: '220px', lg: '240px' }}
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
        ml={{ base: 0, md: '220px', lg: '240px' }}
        mt="60px"
        p={{ base: 3, sm: 4, md: 6 }}
        minH="calc(100vh - 60px)"
        maxW="100%"
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
