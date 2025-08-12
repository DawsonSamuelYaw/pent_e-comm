#include <iostream>
using namespace std;

int main() {
    double accountBalance;
    double withdrawalAmount;
    const double MAX_WITHDRAWAL = 500.0;
    const double SERVICE_CHARGE_RATE = 0.04;
    const double LOW_FUNDS_CHARGE = 25.0;

    // Get account balance
    cout << "Enter your account balance: $";
    cin >> accountBalance;

    // Check if account has no money or is negative
    if (accountBalance <= 0) {
        cout << "Withdrawal not allowed. Your account has insufficient or negative balance.\n";
        return 0;
    }

    // Ask for withdrawal amount
    cout << "Enter the amount you wish to withdraw: $";
    cin >> withdrawalAmount;

    // Validate withdrawal amount
    if (withdrawalAmount <= 0) {
        cout << "Invalid withdrawal amount.\n";
        return 0;
    }

    // Check maximum withdrawal limit
    if (withdrawalAmount > MAX_WITHDRAWAL) {
        cout << "You can only withdraw a maximum of $500 per day.\n";
        return 0;
    }

    double totalDeduction = withdrawalAmount;

    // Apply service charge if withdrawal > $300
    if (withdrawalAmount > 300) {
        double extra = withdrawalAmount - 300;
        double serviceCharge = extra * SERVICE_CHARGE_RATE;
        totalDeduction += serviceCharge;

        cout << "A service charge of $" << serviceCharge << " will be applied.\n";
    }

    // Check if user has enough balance
    if (totalDeduction > accountBalance) {
        cout << "Insufficient funds. Your balance is $" << accountBalance << ".\n";
        cout << "Would you like to proceed with a $25.00 service charge instead? (Y/N): ";
        char choice;
        cin >> choice;

        if (choice == 'Y' || choice == 'y') {
            totalDeduction = withdrawalAmount + LOW_FUNDS_CHARGE;
            if (totalDeduction > accountBalance) {
                cout << "Still not enough funds. Transaction canceled.\n";
            } else {
                accountBalance -= totalDeduction;
                cout << "Transaction successful with $25.00 charge.\n";
                cout << "New account balance: $" << accountBalance << endl;
            }
        } else {
            cout << "Transaction canceled by user.\n";
        }
    } else {
        accountBalance -= totalDeduction;
        cout << "Transaction successful. $" << withdrawalAmount << " withdrawn.\n";
        cout << "New account balance: $" << accountBalance << endl;
    }

    return 0;
}
