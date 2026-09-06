pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

template ComplianceVerify() {
    signal input age;
    signal input idNumber; 
    signal input ageThreshold; 

    signal output isEligible;
    signal output identityCommitment;

    // 1. Check if age >= ageThreshold
    component greaterEq = GreaterEqThan(8); 
    greaterEq.in[0] <== age;
    greaterEq.in[1] <== ageThreshold;
    isEligible <== greaterEq.out;

    // Force the proof to fail if age is too low
    isEligible === 1;

    // 2. Hash the ID to hide it on the blockchain
    component hasher = Poseidon(1);
    hasher.inputs[0] <== idNumber;
    identityCommitment <== hasher.out;
}

component main {public [ageThreshold]} = ComplianceVerify();