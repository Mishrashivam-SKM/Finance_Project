import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  Text,
  useToast,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Spinner,
  Center,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  // Profile form state
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // UI state
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const { token } = useAuth();
  const toast = useToast();

  // Colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const successColor = useColorModeValue('green.500', 'green.300');
  const inputBg = useColorModeValue('gray.50', 'gray.900');
  const alertBg = useColorModeValue('blue.50', 'blue.900');

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfileData({
          username: data.username || '',
          email: data.email || '',
        });
      } catch (error) {
        toast({
          title: 'Error loading profile',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token, toast]);

  // Validate profile form
  const validateProfileForm = () => {
    const errors = {};

    if (!profileData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!profileData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = 'Invalid email address';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }

    if (!passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    setIsSubmittingProfile(true);

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: profileData.username,
          email: profileData.email,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsSubmittingPassword(true);
    setPasswordSuccess(false);

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmNewPassword: passwordData.confirmNewPassword,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setPasswordErrors({});

      toast({
        title: 'Success',
        description: 'Password changed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      // Clear success message after 5 seconds
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (error) {
      toast({
        title: 'Error changing password',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Handle profile input change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (profileErrors[name]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (isLoadingProfile) {
    return (
      <Center h="60vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="primary.500" thickness="4px" />
          <Text color={textColor}>Loading profile...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Profile Settings
      </Heading>

      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Profile Details Section */}
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Profile Details</Heading>
            </CardHeader>
            <Divider />
            <CardBody>
              <form onSubmit={handleProfileSubmit}>
                <VStack spacing={4} align="stretch">
                  {/* Username Field */}
                  <FormControl isInvalid={!!profileErrors.username}>
                    <FormLabel fontWeight="semibold" color={textColor}>
                      Username
                    </FormLabel>
                    <Input
                      name="username"
                      type="text"
                      value={profileData.username}
                      onChange={handleProfileChange}
                      placeholder="Enter your username"
                      bg={inputBg}
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'primary.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)'
                      }}
                    />
                    {profileErrors.username && (
                      <FormErrorMessage>{profileErrors.username}</FormErrorMessage>
                    )}
                  </FormControl>

                  {/* Email Field */}
                  <FormControl isInvalid={!!profileErrors.email}>
                    <FormLabel fontWeight="semibold" color={textColor}>
                      Email
                    </FormLabel>
                    <Input
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      placeholder="Enter your email"
                      bg={inputBg}
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'primary.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)'
                      }}
                    />
                    {profileErrors.email && (
                      <FormErrorMessage>{profileErrors.email}</FormErrorMessage>
                    )}
                  </FormControl>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    colorScheme="primary"
                    size="md"
                    isLoading={isSubmittingProfile}
                    loadingText="Updating..."
                    mt={4}
                  >
                    Update Profile
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>
        </GridItem>

        {/* Change Password Section */}
        <GridItem>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Change Password</Heading>
            </CardHeader>
            <Divider />
            <CardBody>
              {passwordSuccess && (
                <Alert
                  status="success"
                  variant="subtle"
                  flexDirection="column"
                  alignItems="flex-start"
                  borderRadius="md"
                  mb={4}
                >
                  <HStack>
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Password Changed</AlertTitle>
                      <AlertDescription>
                        Your password has been updated successfully.
                      </AlertDescription>
                    </Box>
                  </HStack>
                </Alert>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <VStack spacing={4} align="stretch">
                  {/* Current Password Field */}
                  <FormControl isInvalid={!!passwordErrors.currentPassword}>
                    <FormLabel fontWeight="semibold" color={textColor}>
                      Current Password
                    </FormLabel>
                    <InputGroup>
                      <Input
                        name="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter current password"
                        bg={inputBg}
                        borderColor={borderColor}
                        _focus={{
                          borderColor: 'primary.500',
                          boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)'
                        }}
                      />
                      <InputRightElement>
                        <IconButton
                          icon={showCurrentPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          variant="ghost"
                          size="sm"
                          aria-label="Toggle password visibility"
                        />
                      </InputRightElement>
                    </InputGroup>
                    {passwordErrors.currentPassword && (
                      <FormErrorMessage>{passwordErrors.currentPassword}</FormErrorMessage>
                    )}
                  </FormControl>

                  {/* New Password Field */}
                  <FormControl isInvalid={!!passwordErrors.newPassword}>
                    <FormLabel fontWeight="semibold" color={textColor}>
                      New Password
                    </FormLabel>
                    <InputGroup>
                      <Input
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                        bg={inputBg}
                        borderColor={borderColor}
                        _focus={{
                          borderColor: 'primary.500',
                          boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)'
                        }}
                      />
                      <InputRightElement>
                        <IconButton
                          icon={showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          variant="ghost"
                          size="sm"
                          aria-label="Toggle password visibility"
                        />
                      </InputRightElement>
                    </InputGroup>
                    {passwordErrors.newPassword && (
                      <FormErrorMessage>{passwordErrors.newPassword}</FormErrorMessage>
                    )}
                  </FormControl>

                  {/* Confirm New Password Field */}
                  <FormControl isInvalid={!!passwordErrors.confirmNewPassword}>
                    <FormLabel fontWeight="semibold" color={textColor}>
                      Confirm New Password
                    </FormLabel>
                    <InputGroup>
                      <Input
                        name="confirmNewPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmNewPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                        bg={inputBg}
                        borderColor={borderColor}
                        _focus={{
                          borderColor: 'primary.500',
                          boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)'
                        }}
                      />
                      <InputRightElement>
                        <IconButton
                          icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          variant="ghost"
                          size="sm"
                          aria-label="Toggle password visibility"
                        />
                      </InputRightElement>
                    </InputGroup>
                    {passwordErrors.confirmNewPassword && (
                      <FormErrorMessage>{passwordErrors.confirmNewPassword}</FormErrorMessage>
                    )}
                  </FormControl>

                  {/* Password Requirements Info */}
                  <Box
                    bg={alertBg}
                    borderLeft="4px"
                    borderColor="primary.500"
                    p={3}
                    borderRadius="md"
                  >
                    <Text fontSize="sm" color={textColor}>
                      <strong>Password Requirements:</strong>
                      <br />
                      • At least 6 characters long
                      <br />
                      • New password must match confirmation
                    </Text>
                  </Box>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    colorScheme="primary"
                    size="md"
                    isLoading={isSubmittingPassword}
                    loadingText="Updating..."
                    mt={4}
                  >
                    Change Password
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
