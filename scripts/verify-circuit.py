"""Read-only feasibility check. No signing, wallets, state overrides or broadcasting."""
import datetime
import json
import random
import urllib.request
from pathlib import Path

RPC = "https://rpc.xlayer.tech"
CPU = "0xe10931e0cfb42c76ced25b4712e7553f24a3d9e9"

def rpc(calls):
    request = urllib.request.Request(RPC, data=json.dumps(calls).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=25) as response:
        results = json.load(response)
    if not isinstance(results, list):
        raise ValueError(results)
    by_id = {item["id"]: item for item in results}
    for call in calls:
        if "error" in by_id[call["id"]]:
            raise ValueError(by_id[call["id"]])
    return [by_id[call["id"]]["result"] for call in calls]

def call(method, params, identifier):
    return {"jsonrpc": "2.0", "id": identifier, "method": method, "params": params}

def word(number):
    return number.to_bytes(32, "big").hex()

def dynamic_bytes(result):
    raw = bytes.fromhex(result[2:])
    offset = int.from_bytes(raw[:32], "big")
    length = int.from_bytes(raw[offset:offset+32], "big")
    assert offset + 32 + length <= len(raw)
    return raw[offset+32:offset+32+length]

chain, height = rpc([call("eth_chainId", [], 1), call("eth_blockNumber", [], 2)])
assert int(chain, 16) == 196
block = hex(int(height, 16) - 2)
info, netlist_raw, block_data = rpc([
    call("eth_call", [{"to": CPU, "data": "0x084d60f1"+word(1)}, block], 3),
    call("eth_call", [{"to": CPU, "data": "0x3fc4be56"+word(1)}, block], 4),
    call("eth_getBlockByNumber", [block, False], 5),
])
metadata = [int(info[2+i*64:2+(i+1)*64], 16) for i in range(4)]
n_in, n_out, n_state, gate_count = metadata
assert metadata == [19, 1, 0, 74]
netlist = dynamic_bytes(netlist_raw)
assert len(netlist) == gate_count*7
gates = []
for offset in range(0, len(netlist), 7):
    assert netlist[offset] == 0, "This check supports combinational NAND only"
    a = int.from_bytes(netlist[offset+1:offset+4], "big")
    b = int.from_bytes(netlist[offset+4:offset+7], "big")
    assert max(a, b) < 2+n_in+len(gates)
    gates.append((a, b))

def evaluate(packed):
    bits = [0, 1]+[(packed >> i)&1 for i in range(n_in)]
    for a, b in gates:
        bits.append(1-(bits[a]&bits[b]))
    return bytes([bits[-1]])

mask = (1 << n_in)-1
generator = random.Random(20261029)
vectors = [0, mask]+[1 << i for i in range(n_in)]+[0x55555 & mask, 0x2aaaa & mask]
vectors += [generator.randrange(mask+1) for _ in range(9)]
records = []
for start in range(0, len(vectors), 8):
    requests = []
    for i, vector in enumerate(vectors[start:start+8]):
        packed = vector.to_bytes(3, "little")
        data = "0x934d06ea"+word(1)+word(64)+word(len(packed))+packed.hex().ljust(64, "0")
        requests.append(call("eth_call", [{"to": CPU, "data": data}, block], 10+start+i))
    outputs = rpc(requests)
    for vector, result in zip(vectors[start:start+8], outputs):
        local = evaluate(vector)
        actual = dynamic_bytes(result)
        assert local == actual, (vector, local.hex(), actual.hex())
        records.append({"inputs": vector.to_bytes(3, "little").hex(), "local": local.hex(), "chain": actual.hex(), "raw": result})

result = {"checked_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(), "rpc": RPC,
          "chain_id": 196, "processor": CPU, "circuit_id": 1, "block_number": int(block,16),
          "block_hash": block_data["hash"], "metadata": metadata, "netlist_hex": netlist.hex(),
          "vectors": records, "matches": len(records), "scope": "One combinational circuit; read-only calls; no independent RPC quorum or signature/authorization audit"}
(Path(__file__).resolve().parents[1] / "evidence" / "circuit-evaluation-check.json").write_text(json.dumps(result, indent=2)+"\n")
print(json.dumps({key: value for key, value in result.items() if key not in ("vectors", "netlist_hex")}, indent=2))
