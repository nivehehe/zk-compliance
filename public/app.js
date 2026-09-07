async function generateProof() {
    const statusText = document.getElementById('status');
    const resultsCard = document.getElementById('resultsCard');
    const proveBtn = document.getElementById('proveBtn');

    // 1. Get the private data from the user interface
    const ageInput = document.getElementById('age').value;
    const idInput = document.getElementById('idNumber').value;

    // The threshold is a public rule set by the application
    const inputData = {
        "age": parseInt(ageInput),
        "idNumber": parseInt(idInput),
        "ageThreshold": 18
    };

    statusText.innerText = "Calculating zero-knowledge proof in browser... Please wait.";
    proveBtn.disabled = true;
    resultsCard.classList.add('hidden');

    try {
        // 2. Run the SnarkJS fullProve function locally
        // This takes the input data, the WASM circuit, and the Proving Key
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            inputData, 
            "compliance.wasm", 
            "compliance_0001.zkey"
        );

        // 3. Display the results to the user
        document.getElementById('publicOutput').innerText = JSON.stringify(publicSignals, null, 2);
        document.getElementById('proofOutput').innerText = JSON.stringify(proof, null, 2);
        
        statusText.innerText = "Success! Data remains private.";
        resultsCard.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        statusText.innerText = "Proof Failed! User does not meet the requirements (or invalid input).";
        statusText.style.color = "red";
    } finally {
        proveBtn.disabled = false;
    }
}