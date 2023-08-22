# Solidity Coding Convention

## 1. Order of Layout

-   Layout thứ tự các thành phần trong file .sol:

    1. Pragma statements

    2. Import statements

    3. Interfaces

    4. Libraries

    5. Contracts

-   Layout thứ tự các thành phần trong contract:

    1. Type declaration (using library, enum, struct)

    2. State variables

    3. Errors

    4. Events

    5. Modifiers

    6. Functions

-   Layout thứ tự các function trong contract:

    1. Constructor

    2. receive function (if exists)

    3. fallback function (if exists)

    4. External functions

    5. Public functions

    6. Internal functions

    7. Private functions


```
// SPDX-License-Identifier: MIT

// pragma statement
pragma solidity ^0.8.4;

// import statement
import "./Foo.sol";


// interface
interface ICounter {

}


// library
library Math {
    
}


// contract
contract SampleContract {

    // Type declaration
    using Strings for uint256;

    enum TokenType {
        // ...
    }

    struct TokenInfo {
        // ...
    }

    // State variables
    uint256 public storagedNumber;
    mapping(uint256 => address) owners;

    // Error declaration
    error InvalidNumber(uint256 number);

    // Event declaration
    event Transfer(address from, address to, uint256 amount);

    // modifier
    modifier onlyOwner() {
        // ...
    }

    constructor() {
        // ...
    }

    receive() external payable {
        // ...
    }

    fallback() external {
        // ...
    }

    // External functions
    // ...

    // External functions that are view
    // ...

    // External functions that are pure
    // ...

    // Public functions
    // ...

    // Internal functions
    // ...

    // Private functions
    // ...
}

```

## 2. Naming convention

-   Contract, Interface, Library:

    -   Tên nên đặt theo PascalCase (CapWord). Eg: `SimpleToken`, `IERC20`, `Counter`.
    -   Tên contract, interface, library nên đặt theo tên file chứa chúng. Nếu trong file có nhiều thành phần thì đặt tên file theo thành phần chính trong file.
        ```
        interface IERC20 {
            // ...
        }

        library Math {
            // ...
        }

        contract SimpleToken {
            // ...
        }
        ```

-   enum, struct, error, event: PascalCase. Eg: `TokenType`, `Position`, `Transfer`, `InvalidInput`.
    ```
    enum Direction {
        // ...
    }

    struct Box {
        // ...
    }

    error NotTheOwner();

    event Log();
    ```
- Recommended Event Name: N + Ved. Eg: WalletCreated, RoleGranted, OwnershipTransferred,..

-   function, modifier, function argument, local variable và state variable: camelCase. Eg: `createWallet`, `onlyOwner`, `newPrice`, `totalSupply`.
    ```
    address owner;
    uint256 balance;

    // ...

    modifier validAddress {
        
    }

    // ...

    function withdraw(uint256 amountWithdraw) public {
        uint256 newBalance;
    }

    function getBalance(address owner) public view {
        // ...
    }
    ```

-   constant: UPPER_CASE_WITH_UNDERSCORES. Eg: `TOKEN_NAME`, `SYMBOL`
    ```
    uint256 constant BASE_FEE = 10000000;
    address constant TOKEN_NAME = "ABC";
    ```

-   Để tránh xung đột giữa các state variable, local variable, argument,... ta có thể thêm dấu `_` sau tên của chúng. Eg: `amount_`, `price_`

## 3. Code Layout

-   Thụt lề: 4 space mỗi level.
-   Tab or Space: ưu tiên sử dụng space, không nên sử dụng lẫn lộn tab và space.
-   Blank line:
    - Các function trong contract cách nhau bởi 1 blank line. Blank line có thể được bỏ qua với một nhóm các khai báo function có liên quan (Eg: các khai báo function trong abstract contract).
        ```
        abstract contract A {
            // Omit blank line
            function spam() public pure virtual;
            function ham() public pure virtual;
        }

        contract B is A {
            function spam() public pure override {
                // ...
            }

            function ham() public pure override {
                // ...
            }
        }
        ```
    - Nếu trong file có nhiều top level declaration (contract, library, interface) thì chúng cách nhau bởi 2 blank line.
        ```
        contract A {
            // ...
        }


        contract B {
            // ...
        }


        contract C {
            // ...
        }
        ```

-   Maximum Line Length: 120 character.
-   Nếu phải xuống dòng, các dòng trong ngoặc `()` nên thỏa mãn:
    -   Đối số đầu tiên không nên gắn với dấu `(` .
    -   Chỉ sử dụng một thụt lề.
    -   Mỗi đối số ở trên một dòng.
    -   Dấu `);` nên ở trên một dòng mới.
        ```
        // Function Calls
        thisFunctionCallIsReallyLong(
            longArgument1,
            longArgument2,
            longArgument3
        );

        // Assignment Statements
        thisIsALongNestedMapping[being][set][toSomeValue] = someFunction(
            argument1,
            argument2,
            argument3,
            argument4
        );

        // Events
        event LongAndLotsOfArgs(
            address sender,
            address recipient,
            uint256 publicKey,
            uint256 amount,
            bytes32[] options
        );
        // Emit event
        LongAndLotsOfArgs(
            sender,
            recipient,
            publicKey,
            amount,
            options
        );
        ```

-   Khai báo function:

    -   Thứ tự modifier của function:

        1. Visibility (external, public, internal, view)
        2. Mutability (payable, view, pure)
        3. Virtual
        4. Override
        5. Custom modifier

    -   Với các khai báo function ngắn, dấu { nên ở cùng dòng với khai báo function, dấu { nên ở cùng cấp thụt lề với khai báo function.
    -   Với khai báo function dài, nên theo format sau:
        ```
        function thisFunctionNameIsReallyLong(address x, address y, address z)
            public
            onlyOwner
            priced
            returns (address)
        {
            doSomething();
        }
        
        function thisFunctionNameIsReallyLong(
            address a,
            address b,
            address c
        )
            public
            returns (
                address someAddressName,
                uint256 LongArgument,
                uint256 Argument
            )
        {
            doSomething()

            return (
                veryLongReturnArg1,
                veryLongReturnArg2,
                veryLongReturnArg3
            );
        }
        ```
- Mapping: khai báo mapping nên theo format sau:
    ```
    mapping(uint => uint) map;
    mapping(address => bool) registeredAddresses;
    mapping(uint => mapping(bool => Data[])) public data;
    mapping(uint => mapping(uint => s)) data;
    ```
## 4. Comment
- Comment nên bắt đầu bằng 1 whitespace:
    ```
    // Comment start with a whitespace
    //Not recommended
    ```
- NatSpec:
    - Sử dụng kiểu khai báo: `/**  */`
    - Mỗi NatSpec comment cho một contract, interface, library, function, event, error, public state variable.

