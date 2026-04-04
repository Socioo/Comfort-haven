import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth";
import { useTheme } from "@/contexts/theme";
import Colors from "@/constants/Colors";
import { Text, View, Card } from "@/components/Themed";
import { ChevronLeft, Landmark, CreditCard, User, CheckCircle2, AlertCircle, ChevronDown, Search } from "lucide-react-native";
import { financeAPI } from "@/services/api";

interface Bank {
  name: string;
  code: string;
}

export default function PayoutSettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  
  const styles = createStyles(themeColors);

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBankModal, setShowBankModal] = useState(false);

  const [form, setForm] = useState({
    bankCode: user?.bankCode || "",
    bankName: user?.bankName || "",
    accountNumber: user?.accountNumber || "",
    accountName: user?.accountName || "",
  });

  const [verificationError, setVerificationError] = useState("");

  // Hide parent tab header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Load banks
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setIsLoading(true);
        const response = await financeAPI.getBanks();
        if (response.data.status) {
          setBanks(response.data.data);
          setFilteredBanks(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch banks", error);
        Alert.alert("Error", "Failed to load bank list. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanks();
  }, []);

  // Filter banks on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBanks(banks);
    } else {
      const filtered = banks.filter((bank) =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBanks(filtered);
    }
  }, [searchQuery, banks]);

  const handleBankSelect = (bank: Bank) => {
    setForm((prev) => ({
      ...prev,
      bankCode: bank.code,
      bankName: bank.name,
      accountName: "", // Reset account name when bank changes
    }));
    setShowBankModal(false);
    setSearchQuery("");
    setVerificationError("");
  };

  const verifyAccount = async () => {
    if (form.accountNumber.length !== 10) return;
    if (!form.bankCode) return;

    try {
      setIsVerifying(true);
      setVerificationError("");
      const response = await financeAPI.verifyAccount({
        accountNumber: form.accountNumber,
        bankCode: form.bankCode,
      });

      if (response.data.status) {
        setForm((prev) => ({
          ...prev,
          accountName: response.data.data.account_name,
        }));
      }
    } catch (error: any) {
      setVerificationError(error.response?.data?.message || "Could not verify account. Please check the details.");
      setForm((prev) => ({ ...prev, accountName: "" }));
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-verify when account number reaches 10 digits
  useEffect(() => {
    if (form.accountNumber.length === 10 && form.bankCode) {
      verifyAccount();
    }
  }, [form.accountNumber, form.bankCode]);

  const hasChanges = 
    form.bankCode !== (user?.bankCode || "") || 
    form.accountNumber !== (user?.accountNumber || "");

  const handleSave = async () => {
    if (!form.bankCode || !form.accountNumber || !form.accountName) {
      Alert.alert("Error", "Please fill in all details and verify your account.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await financeAPI.createSubaccount({
        bankCode: form.bankCode,
        accountNumber: form.accountNumber,
        bankName: form.bankName,
        accountName: form.accountName,
      });

      if (response.data.success) {
        // Update local auth user state
        updateUser({
          bankCode: form.bankCode,
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          accountName: form.accountName,
          paystackSubaccountCode: response.data.subaccountCode,
        });
        
        Alert.alert("Success", "Payout settings updated successfully. You will now receive 90% of every booking payment automatically.");
        router.back();
      }
    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to save payout settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={styles.container}>
        {/* Header */}
        <Card style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft color={themeColors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payout Settings</Text>
          <View style={{ width: 40 }} />
        </Card>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoSummary}>
            <Text style={styles.infoDescription}>
              As a host, your earnings (90% of booking total) are sent automatically to this account via Paystack after each successful booking.
            </Text>
          </View>

          <Card style={styles.fieldsContainer}>
            {/* Bank Selection */}
            <TouchableOpacity 
              style={styles.field} 
              onPress={() => setShowBankModal(true)}
              disabled={isLoading}
            >
              <View style={styles.fieldIcon}>
                <Landmark color={Colors.primary} size={18} strokeWidth={1.5} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>SELECT BANK</Text>
                <View style={styles.selectRow}>
                  <Text style={[styles.fieldValue, !form.bankName && { color: themeColors.textLight }]}>
                    {form.bankName || "Pick your bank"}
                  </Text>
                  <ChevronDown color={themeColors.textLight} size={20} />
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Account Number */}
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <CreditCard color={Colors.primary} size={18} strokeWidth={1.5} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>ACCOUNT NUMBER</Text>
                <TextInput
                  style={[styles.fieldInput, { color: themeColors.text }]}
                  value={form.accountNumber}
                  onChangeText={(v) => {
                    const clean = v.replace(/[^0-9]/g, "").substring(0, 10);
                    setForm((p) => ({ ...p, accountNumber: clean }));
                  }}
                  placeholder="10-digit NUBAN"
                  placeholderTextColor={themeColors.textLight}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Account Name (Auto-verified) */}
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <User color={Colors.primary} size={18} strokeWidth={1.5} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>ACCOUNT NAME</Text>
                {isVerifying ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
                ) : (
                  <View style={styles.verifiedRow}>
                    <Text style={[styles.fieldValue, !form.accountName && { color: themeColors.textLight }]}>
                      {form.accountName || "Will verify automatically..."}
                    </Text>
                    {form.accountName ? <CheckCircle2 color="#10b981" size={18} /> : null}
                  </View>
                )}
                {verificationError ? (
                  <View style={styles.errorRow}>
                    <AlertCircle color="#ef4444" size={14} />
                    <Text style={styles.errorText}>{verificationError}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Card>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!form.accountName || isSaving || (!hasChanges && !!user?.paystackSubaccountCode)) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!form.accountName || isSaving || (!hasChanges && !!user?.paystackSubaccountCode)}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {user?.paystackSubaccountCode ? "Update Bank Account" : "Link Bank Account"}
              </Text>
            )}
          </TouchableOpacity>

          {user?.paystackSubaccountCode && (
            <View style={styles.statusBox}>
              <CheckCircle2 color="#10b981" size={20} />
              <Text style={styles.statusText}>
                Your payout account is linked. Update details above to change it.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bank Selection Modal */}
        <Modal
          visible={showBankModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowBankModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Bank</Text>
                <TouchableOpacity onPress={() => setShowBankModal(false)}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <Search color={themeColors.textLight} size={20} />
                <TextInput
                  style={[styles.searchInput, { color: themeColors.text }]}
                  placeholder="Search bank name..."
                  placeholderTextColor={themeColors.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <FlatList
                data={filteredBanks}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.bankItem}
                    onPress={() => handleBankSelect(item)}
                  >
                    <Text style={styles.bankName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.divider} />}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            </Card>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  backButton: {
    padding: 4,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  infoSummary: {
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: themeColors.textLight,
  },
  fieldsContainer: {
    borderRadius: 20,
    paddingVertical: 12,
    shadowColor: themeColors.shadow || "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 16,
    backgroundColor: "transparent",
  },
  fieldIcon: {
    width: 32,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  fieldContent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: themeColors.textLight,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  fieldInput: {
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 4,
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  verifiedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: themeColors.textLight + '50',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: 'transparent',
  },
  statusText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: themeColors.border,
    marginHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.border + '30',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  bankItem: {
    paddingVertical: 18,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  bankName: {
    fontSize: 16,
    fontWeight: '500',
  },
});
